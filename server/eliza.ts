import { generateDockingReport, categorizeDockingData } from "./gemini";
import { storage } from "./storage";

// Simplified Eliza Agent for Docking Analysis
class DockingAgent {
  name = "NeuraViva Docking Agent";

  async processSimulation(simulationId: number) {
    try {
      // Get simulation data
      const simulation = await storage.getSimulationById(simulationId);
      if (!simulation) {
        return { error: "Simulation not found" };
      }

      // Auto-categorize
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

      // Generate report
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

      // Save report
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

      // Update simulation status
      await storage.updateSimulation(simulation.id, { status: "analyzed" });

      return {
        success: true,
        reportId: report.reportId,
        tags: categorization.tags,
        message: "Simulation processed successfully"
      };

    } catch (error: any) {
      return { error: error.message };
    }
  }

  private isPolling = false;
  private pollingInterval: NodeJS.Timeout | null = null;

  async startPolling(intervalMs: number = 10000) {
    if (this.isPolling) return;
    
    console.log("🚀 Agent starting background polling...");
    this.isPolling = true;

    this.pollingInterval = setInterval(async () => {
      try {
        await this.processPendingSimulations();
      } catch (error) {
        console.error("❌ Agent polling error:", error);
      }
    }, intervalMs);
  }

  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    this.isPolling = false;
    console.log("🛑 Agent stopped polling.");
  }

  async processPendingSimulations() {
    // Find one pending simulation
    // In a real app, successful DB queries are needed. 
    // We'll filter all for memory-simplicity or add a specific DB query method if this gets slow.
    const allSimulations = await storage.getAllSimulations();
    const pending = allSimulations.find(s => s.status === "pending");

    if (pending) {
      console.log(`🤖 Agent found pending simulation: ${pending.proteinTarget} (${pending.id})`);
      await this.updateSimulationStatus(pending.id, "processing");
      
      // Simulate processing time for "Agent" feel
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      await this.processSimulation(pending.id);
    }
  }

  // Helper handling connection between storage and agent status
  private async updateSimulationStatus(id: number, status: string) {
    await storage.updateSimulation(id, { status });
  }

  async generateInsights() {
    try {
      const simulations = await storage.getAllSimulations();
      const reports = await storage.getAllReports();

      // Generate insights
      const insights = {
        totalSimulations: simulations.length,
        successRate: `${((simulations.filter(s => s.status === "analyzed").length / simulations.length) * 100).toFixed(1)}%`,
        averageBindingAffinity: simulations.reduce((sum, sim) => sum + sim.bindingAffinity, 0) / simulations.length,
        proteinTargets: Array.from(new Set(simulations.map(s => s.proteinTarget))),
        therapeuticAreas: Array.from(new Set(simulations.map(s => s.proteinTarget).map(target => {
          // Simple mapping - in production this would be more sophisticated
          if (target.includes("EGFR") || target.includes("JAK")) return "Oncology";
          if (target.includes("SARS")) return "Antiviral";
          if (target.includes("HSP")) return "Cancer";
          return "Other";
        }))),
        recommendations: [
          "Focus on EGFR-TK inhibitors showing strong binding affinities",
          "Investigate SARS-CoV-2 Mpro for antiviral drug development",
          "Consider combination therapies targeting multiple pathways"
        ]
      };

      return insights;
    } catch (error: any) {
      return { error: error.message };
    }
  }
}

// Singleton agent instance
const dockingAgent = new DockingAgent();

export async function getDockingAgent(): Promise<DockingAgent> {
  return dockingAgent;
}

export async function processSimulationWithAgent(simulationId: number) {
  const agent = await getDockingAgent();
  return agent.processSimulation(simulationId);
}

export async function getAgentInsights() {
  const agent = await getDockingAgent();
  return agent.generateInsights();
}