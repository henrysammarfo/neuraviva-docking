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

      // Handle empty data gracefully
      if (simulations.length === 0) {
        return {
          totalSimulations: 0,
          successRate: "0%",
          averageBindingAffinity: 0,
          proteinTargets: [],
          therapeuticAreas: [],
          recommendations: [
            "No simulations yet. Submit your first docking job to get started!",
            "Use the 'New Simulation' button to add protein-ligand docking data.",
            "The AI agent will automatically analyze your submissions."
          ],
          recentActivity: "Waiting for data..."
        };
      }

      const analyzedCount = simulations.filter(s => s.status === "analyzed").length;
      const processingCount = simulations.filter(s => s.status === "processing").length;
      const avgAffinity = simulations.reduce((sum, sim) => sum + sim.bindingAffinity, 0) / simulations.length;

      // Get unique protein targets
      const proteinTargets = Array.from(new Set(simulations.map(s => s.proteinTarget)));

      // Map to therapeutic areas
      const therapeuticAreas = Array.from(new Set(proteinTargets.map(target => {
        if (target.includes("EGFR") || target.includes("JAK") || target.includes("kinase")) return "Oncology";
        if (target.includes("SARS") || target.includes("viral") || target.includes("protease")) return "Antiviral";
        if (target.includes("HSP") || target.includes("heat")) return "Cancer";
        if (target.includes("ACE") || target.includes("cardio")) return "Cardiovascular";
        return "General Research";
      })));

      // Generate DYNAMIC recommendations based on actual data
      const recommendations: string[] = [];

      // Best performing simulation
      const bestSim = simulations.reduce((best, curr) =>
        curr.bindingAffinity < best.bindingAffinity ? curr : best, simulations[0]);
      recommendations.push(`Strong binding detected: ${bestSim.proteinTarget} with ${bestSim.ligandName} (${bestSim.bindingAffinity} kcal/mol)`);

      // Processing status
      if (processingCount > 0) {
        recommendations.push(`${processingCount} simulation(s) currently being processed by the AI agent.`);
      }

      // Success rate insight
      if (analyzedCount > 0) {
        recommendations.push(`${analyzedCount} of ${simulations.length} simulations fully analyzed (${Math.round(analyzedCount / simulations.length * 100)}% complete).`);
      }

      // Most researched target
      const targetCounts = simulations.reduce((acc, s) => {
        acc[s.proteinTarget] = (acc[s.proteinTarget] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      const topTarget = Object.entries(targetCounts).sort((a, b) => b[1] - a[1])[0];
      if (topTarget) {
        recommendations.push(`Most studied target: ${topTarget[0]} with ${topTarget[1]} simulation(s).`);
      }

      return {
        totalSimulations: simulations.length,
        successRate: `${Math.round((analyzedCount / simulations.length) * 100)}%`,
        averageBindingAffinity: avgAffinity.toFixed(2),
        proteinTargets,
        therapeuticAreas,
        recommendations,
        recentActivity: simulations.length > 0
          ? `Last activity: ${new Date(simulations[0].createdAt).toLocaleString()}`
          : "No recent activity"
      };
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