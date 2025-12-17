import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateDockingReport, categorizeDockingData } from "./openai";
import { 
  insertDockingSimulationSchema, 
  insertGeneratedReportSchema,
  insertDataTagSchema 
} from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
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
  app.post("/api/simulations", async (req, res) => {
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
  app.patch("/api/simulations/:id", async (req, res) => {
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
  app.delete("/api/simulations/:id", async (req, res) => {
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
  app.post("/api/simulations/:id/generate-report", async (req, res) => {
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

      // Save report to database
      const report = await storage.createReport({
        reportId,
        simulationId: simulation.id,
        title: `${simulation.proteinTarget} - ${simulation.ligandName} Analysis`,
        executiveSummary: reportContent.executiveSummary,
        fullContent: reportContent.fullContent,
        performanceMetrics: reportContent.performanceMetrics,
        visualizations: null,
        solanaVerificationHash: null,
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

  return httpServer;
}
