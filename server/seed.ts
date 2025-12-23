import { storage } from "./storage";

async function seed() {
  console.log("Seeding database with initial docking simulations...");

  const simulations = [
    {
      simulationId: "NV-2024-001",
      proteinTarget: "EGFR-TK",
      ligandName: "Gefitinib",
      bindingAffinity: -9.8,
      rmsd: 1.2,
      status: "analyzed",
      ligandEfficiency: 0.42,
      inhibitionConstant: 12.5,
      interactionData: {
        hBonds: 4,
        hydrophobic: 7,
        piStacking: 2,
        saltBridges: 1,
        stabilityScore: 85,
        drugLikenessScore: 78,
        toxicityRisk: "low"
      },
      visualizationUrl: null,
      solanaTransactionId: "5KJp8XjJ1YrZx9qN4wP2mVvH3fL7dG8sK9tR6uQ1xWzY"
    },
    {
      simulationId: "NV-2024-002",
      proteinTarget: "SARS-CoV-2 Mpro",
      ligandName: "PF-07321332",
      bindingAffinity: -8.4,
      rmsd: 1.5,
      status: "pending",
      ligandEfficiency: 0.38,
      inhibitionConstant: 24.8,
      interactionData: null,
      visualizationUrl: null,
      solanaTransactionId: null
    },
    {
      simulationId: "NV-2024-003",
      proteinTarget: "HSP90",
      ligandName: "Geldanamycin",
      bindingAffinity: -7.2,
      rmsd: 2.1,
      status: "failed",
      ligandEfficiency: 0.31,
      inhibitionConstant: 58.2,
      interactionData: null,
      visualizationUrl: null,
      solanaTransactionId: null
    },
    {
      simulationId: "NV-2024-004",
      proteinTarget: "BRD4",
      ligandName: "JQ1",
      bindingAffinity: -9.1,
      rmsd: 0.8,
      status: "analyzed",
      ligandEfficiency: 0.45,
      inhibitionConstant: 18.3,
      interactionData: {
        hBonds: 3,
        hydrophobic: 8,
        piStacking: 3,
        saltBridges: 0,
        stabilityScore: 92,
        drugLikenessScore: 82,
        toxicityRisk: "low"
      },
      visualizationUrl: null,
      solanaTransactionId: "8NqW2kL5pXzR9mJ7vH4tF6dS3gY1oU9eQ8rT2iP5xKwZ"
    },
    {
      simulationId: "NV-2024-005",
      proteinTarget: "JAK2",
      ligandName: "Ruxolitinib",
      bindingAffinity: -8.9,
      rmsd: 1.1,
      status: "analyzed",
      ligandEfficiency: 0.40,
      inhibitionConstant: 20.1,
      interactionData: {
        hBonds: 5,
        hydrophobic: 6,
        piStacking: 1,
        saltBridges: 2,
        stabilityScore: 88,
        drugLikenessScore: 75,
        toxicityRisk: "medium"
      },
      visualizationUrl: null,
      solanaTransactionId: "3HgF9jK2nMzP8vL5wT4sD7cR1qX6oY3eU9iN2tB5pKwA"
    },
    {
      simulationId: "NV-2024-006",
      proteinTarget: "Bcl-2",
      ligandName: "Venetoclax",
      bindingAffinity: -10.2,
      rmsd: 1.3,
      status: "processing",
      ligandEfficiency: 0.48,
      inhibitionConstant: 8.7,
      interactionData: null,
      visualizationUrl: null,
      solanaTransactionId: null
    },
    {
      simulationId: "NV-2024-007",
      proteinTarget: "CDK4/6",
      ligandName: "Palbociclib",
      bindingAffinity: -8.5,
      rmsd: 1.4,
      status: "analyzed",
      ligandEfficiency: 0.36,
      inhibitionConstant: 28.4,
      interactionData: {
        hBonds: 4,
        hydrophobic: 5,
        piStacking: 2,
        saltBridges: 1,
        stabilityScore: 79,
        drugLikenessScore: 68,
        toxicityRisk: "low"
      },
      visualizationUrl: null,
      solanaTransactionId: "7MkP4qL9nWzX2vH8tF6sD3jR5oY1eU9iN2tB8pKwQ6cA"
    },
  ];

  for (const sim of simulations) {
    try {
      const existing = await storage.getSimulationBySimulationId(sim.simulationId);
      if (!existing) {
        await storage.createSimulation(sim);
        console.log(`✓ Created simulation: ${sim.simulationId}`);
      } else {
        console.log(`- Simulation already exists: ${sim.simulationId}`);
      }
    } catch (error: any) {
      console.error(`✗ Error creating simulation ${sim.simulationId}:`, error.message);
    }
  }

  console.log("✓ Database seeding complete!");
}

seed().catch(console.error);
