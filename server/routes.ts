import type { Express } from "express";
import { createServer, type Server } from "http";
import rateLimit from "express-rate-limit"; // Bot protection
import { storage } from "./storage";
import { generateDockingReport, categorizeDockingData } from "./gemini";
import { createVerificationTransaction } from "./solana";
import { getAgentInsights } from "./eliza";
import {
  insertDockingSimulationSchema,
  insertGeneratedReportSchema,
  insertDataTagSchema
} from "@shared/schema";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import { comparePassword } from "./storage";
import memorystore from "memorystore";
const MemoryStore = memorystore(session);

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Anti-Bot & Rate Limiting Middleware
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: "Too many requests from this IP, please try again after 15 minutes",
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  });

  // Session Setup
  app.use(
    session({
      cookie: { maxAge: 86400000 },
      store: new MemoryStore({
        checkPeriod: 86400000 // prune expired entries every 24h
      }),
      resave: false,
      saveUninitialized: false,
      secret: "neuraviva-secret-key",
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  // Passport Configuration
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user) {
          return done(null, false, { message: "Incorrect username." });
        }
        if (!(await comparePassword(password, user.password))) {
          return done(null, false, { message: "Incorrect password." });
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    })
  );

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // Auth Routes
  app.post("/api/register", async (req, res, next) => {
    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).send("Username already exists");
      }
      const user = await storage.createUser(req.body);
      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(user);
      });
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    res.json(req.user);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });

  // Middleware to protect routes
  const isAuthenticated = (req: any, res: any, next: any) => {
    if (req.isAuthenticated()) return next();
    res.status(401).send("Unauthorized");
  };

  // Apply to all API routes except public ones
  // app.use("/api", limiter);  // Already applied below


  // Apply to all API routes
  app.use("/api", limiter);

  // ==================== DOCKING SIMULATIONS ====================

  // Get all simulations with optional filters
  app.get("/api/simulations", async (req, res) => {
    try {
      const { status, search } = req.query;
      const simulations = await storage.getAllSimulations({
        status: status as string | undefined,
        search: search as string | undefined,
      });
      res.json(simulations);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get simulation by ID
  app.get("/api/simulations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const simulation = await storage.getSimulationById(id);

      if (!simulation) {
        return res.status(404).json({ error: "Simulation not found" });
      }

      res.json(simulation);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create new simulation
  app.post("/api/simulations", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertDockingSimulationSchema.parse(req.body);
      const simulation = await storage.createSimulation(validatedData);

      // Auto-categorize using AI
      try {
        const categorization = await categorizeDockingData({
          proteinTarget: simulation.proteinTarget,
          ligandName: simulation.ligandName,
          bindingAffinity: simulation.bindingAffinity,
        });

        // Add tags
        for (const tag of categorization.tags) {
          await storage.createTag({
            simulationId: simulation.id,
            tagType: tag.type,
            tagValue: tag.value,
          });
        }
      } catch (aiError) {
        console.error("AI categorization failed:", aiError);
      }

      res.status(201).json(simulation);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Update simulation
  app.patch("/api/simulations/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;

      const simulation = await storage.updateSimulation(id, updates);

      if (!simulation) {
        return res.status(404).json({ error: "Simulation not found" });
      }

      res.json(simulation);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Delete simulation
  app.delete("/api/simulations/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteSimulation(id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ==================== AI REPORT GENERATION ====================

  // Generate AI report for a simulation
  app.post("/api/simulations/:id/generate-report", isAuthenticated, async (req, res) => {
    try {
      const simulationId = parseInt(req.params.id);
      const simulation = await storage.getSimulationById(simulationId);

      if (!simulation) {
        return res.status(404).json({ error: "Simulation not found" });
      }

      // Generate report using AI
      const reportContent = await generateDockingReport({
        proteinTarget: simulation.proteinTarget,
        ligandName: simulation.ligandName,
        bindingAffinity: simulation.bindingAffinity,
        rmsd: simulation.rmsd,
        ligandEfficiency: simulation.ligandEfficiency || undefined,
        inhibitionConstant: simulation.inhibitionConstant || undefined,
        interactionData: simulation.interactionData as any,
      });

      // Generate unique report ID
      const reportId = `REP-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

      // Create Solana verification transaction
      let solanaVerificationHash = null;
      try {
        solanaVerificationHash = await createVerificationTransaction({
          reportId,
          simulationId: simulation.id.toString(),
          executiveSummary: reportContent.executiveSummary,
          generatedAt: new Date().toISOString(),
        });
      } catch (solanaError) {
        console.error("Solana verification failed:", solanaError);
        // Continue without verification for now
      }

      // Save report to database
      const report = await storage.createReport({
        reportId,
        simulationId: simulation.id,
        title: `${simulation.proteinTarget} - ${simulation.ligandName} Analysis`,
        executiveSummary: reportContent.executiveSummary,
        fullContent: reportContent.fullContent,
        performanceMetrics: reportContent.performanceMetrics,
        visualizations: null,
        solanaVerificationHash,
      });

      res.status(201).json(report);
    } catch (error: any) {
      console.error("Report generation error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // ==================== REPORTS ====================

  // Get all reports
  app.get("/api/reports", async (req, res) => {
    try {
      const reports = await storage.getAllReports();
      res.json(reports);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get report by ID
  app.get("/api/reports/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const report = await storage.getReportById(id);

      if (!report) {
        return res.status(404).json({ error: "Report not found" });
      }

      res.json(report);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get report by reportId
  app.get("/api/reports/by-id/:reportId", async (req, res) => {
    try {
      const reportId = req.params.reportId;
      const report = await storage.getReportByReportId(reportId);

      if (!report) {
        return res.status(404).json({ error: "Report not found" });
      }

      res.json(report);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ==================== TAGS ====================

  // Get tags for a simulation
  app.get("/api/simulations/:id/tags", async (req, res) => {
    try {
      const simulationId = parseInt(req.params.id);
      const tags = await storage.getTagsForSimulation(simulationId);
      res.json(tags);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ==================== DASHBOARD STATS ====================

  // Get dashboard statistics
  app.get("/api/stats", async (req, res) => {
    try {
      const allSimulations = await storage.getAllSimulations();
      const allReports = await storage.getAllReports();

      const activeSimulations = allSimulations.filter(s => s.status === "processing").length;
      const completedSimulations = allSimulations.filter(s => s.status === "analyzed").length;
      const successRate = allSimulations.length > 0
        ? ((completedSimulations / allSimulations.length) * 100).toFixed(1)
        : "0.0";

      res.json({
        activeSimulations,
        totalSimulations: allSimulations.length,
        successRate: `${successRate}%`,
        pendingReports: allReports.length,
        computeNodes: 148,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ==================== ELIZA AGENT ====================

  // Get agent insights
  app.get("/api/agent/insights", async (req, res) => {
    try {
      const insights = await getAgentInsights();
      res.json(insights);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Start Agent Autonomy
  const agent = await getAgentInsights(); // Ensure singleton created
  // In a real app we'd import the instance directly or method, but eliza.ts singleton handling is a bit loose.
  // We'll fix this by just importing the singleton in routes or modifying logic.
  // Actually, let's just use the exported singleton access

  import("./eliza").then(module => {
    module.getDockingAgent().then(agent => agent.startPolling(5000));
  });

  return httpServer;
}
