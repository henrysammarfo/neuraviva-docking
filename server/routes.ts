import type { Express } from "express";
import { createServer, type Server } from "http";
import rateLimit from "express-rate-limit"; // Bot protection
import { storage } from "./storage.js";
import { generateDockingReport, categorizeDockingData } from "./gemini.js";
import { createVerificationTransaction } from "./solana.js";
import { getAgentInsights, getDockingAgent } from "./eliza.js";
import {
  insertDockingSimulationSchema,
  insertGeneratedReportSchema,
  insertDataTagSchema
} from "../shared/schema.js";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import { comparePassword } from "./storage.js";
import memorystore from "memorystore";
const MemoryStore = memorystore(session);

export function registerRoutes(
  _httpServer: Server,
  app: Express
): Server | void {

  // Anti-Bot & Rate Limiting Middleware
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: "Too many requests from this IP, please try again after 15 minutes",
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Session Setup
  app.use(
    session({
      cookie: { maxAge: 86400000 },
      store: new MemoryStore({
        checkPeriod: 86400000
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
    console.log(`[auth] Serializing user: ${user.id}`);
    done(null, user.id);
  });

  passport.deserializeUser(async (id: any, done) => {
    try {
      console.log(`[auth] Deserializing user: ${id}`);
      const user = await storage.getUser(id);
      if (!user) {
        console.warn(`[auth] No user found during deserialization for ID: ${id}`);
        return done(null, false);
      }
      done(null, user);
    } catch (err: any) {
      console.error(`[auth] Deserialization error for ID ${id}:`, err);
      done(err);
    }
  });

  // ... (rest of the routes are unchanged until the end)


  // Auth Routes
  app.post("/api/register", async (req, res, next) => {
    try {
      console.log(`[auth] Attempting registration for: ${req.body.username}`);
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).send("Username already exists");
      }
      const user = await storage.createUser(req.body);
      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(user);
      });
    } catch (err: any) {
      console.error(`[auth] Registration failed for ${req.body.username}:`, err);
      res.status(500).json({
        error: "REGISTRATION_FAILED",
        message: err.message,
        detail: err.detail || "Check server logs for DB connectivity."
      });
    }
  });

  app.post("/api/login", (req, res, next) => {
    console.log(`[auth] Login request received for: ${req.body.username}`);
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        console.error("[auth] Passport authenticate error:", err);
        return next(err);
      }
      if (!user) {
        console.warn("[auth] Login failed:", info?.message || "Unauthorized");
        return res.status(401).json({ error: "AUTH_FAILED", message: info?.message || "Invalid credentials" });
      }
      req.login(user, (loginErr) => {
        if (loginErr) {
          console.error("[auth] req.login error:", loginErr);
          return next(loginErr);
        }
        console.log(`[auth] Login successful for: ${user.username}`);
        res.json(user);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    console.log(`[auth] Logout requested for session: ${req.sessionID}`);
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

  app.patch("/api/user", isAuthenticated, async (req, res) => {
    try {
      console.log(`[auth] Profile update request for user: ${(req.user as any).username} (ID: ${(req.user as any).id})`);
      console.log(`[auth] Update body: ${JSON.stringify(req.body)}`);

      const user = await storage.updateUser((req.user as any).id, req.body);
      if (!user) {
        console.warn(`[auth] No user returned after update for ID: ${(req.user as any).id}`);
        return res.status(404).json({ error: "USER_NOT_FOUND", message: "User not found for update" });
      }

      console.log(`[auth] Profile updated successfully for: ${user.username}`);
      res.json(user);
    } catch (err: any) {
      console.error("[auth] Profile update failed:", err);
      res.status(500).json({
        error: "UPDATE_FAILED",
        message: err.message,
        detail: err.detail || "Database update failed."
      });
    }
  });

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

      // Trigger Agent Autonomy immediately for Vercel (simulating live background processing)
      if (process.env.VERCEL === "1") {
        const agent = await getDockingAgent();
        // Fire and forget, or process in "background"
        agent.processSimulation(simulation.id).catch(err => {
          console.error("Agent background processing failed:", err);
        });
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

  // Delete report
  app.delete("/api/reports/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteReport(id);
      res.status(204).send();
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
        computeNodes: 120 + Math.floor(activeSimulations * 8.5) + (allSimulations.length % 15),
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

  // Start Agent Autonomy (only in non-Vercel environment)
  if (process.env.VERCEL !== "1") {
    getDockingAgent().then(agent => agent.startPolling(10000));
  }

  return _httpServer;
}


