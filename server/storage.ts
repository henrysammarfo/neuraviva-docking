import {
  type User,
  type InsertUser,
  type DockingSimulation,
  type InsertDockingSimulation,
  type GeneratedReport,
  type InsertGeneratedReport,
  type DataTag,
  type InsertDataTag,
  users,
  dockingSimulations,
  generatedReports,
  dataTags
} from "@shared/schema";

import fs from "fs/promises";
import path from "path";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

// File persistence setup
const DATA_FILE = path.join(process.cwd(), "storage.json");

interface StorageData {
  users: User[];
  simulations: DockingSimulation[];
  reports: GeneratedReport[];
  tags: DataTag[];
  ids: {
    user: number; // Added for user ID generation if needed, though current implementation uses Date.now()
    simulation: number;
    report: number;
    tag: number;
  }
}

// Initial mock data to seed if file doesn't exist
const initialData: StorageData = {
  users: [],
  simulations: [
    {
      id: 1,
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
      solanaTransactionId: "5KJp8XjJ1YrZx9qN4wP2mVvH3fL7dG8sK9tR6uQ1xWzY",
      createdAt: new Date("2024-01-15"),
    },
    {
      id: 2,
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
      solanaTransactionId: null,
      createdAt: new Date("2024-01-16"),
    },
    {
      id: 3,
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
      solanaTransactionId: null,
      createdAt: new Date("2024-01-17"),
    },
    {
      id: 4,
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
      solanaTransactionId: "8NqW2kL5pXzR9mJ7vH4tF6dS3gY1oU9eQ8rT2iP5xKwZ",
      createdAt: new Date("2024-01-18"),
    },
    {
      id: 5,
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
      solanaTransactionId: "3HgF9jK2nMzP8vL5wT4sD7cR1qX6oY3eU9iN2tB5pKwA",
      createdAt: new Date("2024-01-19"),
    },
    {
      id: 6,
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
      solanaTransactionId: null,
      createdAt: new Date("2024-01-20"),
    },
    {
      id: 7,
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
      solanaTransactionId: "7MkP4qL9nWzX2vH8tF6sD3jR5oY1eU9iN2tB8pKwQ6cA",
      createdAt: new Date("2024-01-21"),
    },
  ],
  reports: [],
  tags: [],
  ids: {
    user: 1,
    simulation: 8, // Next ID after the 7 initial simulations
    report: 1,
    tag: 1
  }
};

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Docking Simulation methods
  getAllSimulations(filters?: { status?: string; search?: string }): Promise<DockingSimulation[]>;
  getSimulationById(id: number): Promise<DockingSimulation | undefined>;
  getSimulationBySimulationId(simulationId: string): Promise<DockingSimulation | undefined>;
  createSimulation(simulation: InsertDockingSimulation): Promise<DockingSimulation>;
  updateSimulation(id: number, updates: Partial<InsertDockingSimulation>): Promise<DockingSimulation | undefined>;
  deleteSimulation(id: number): Promise<void>;

  // Report methods
  getAllReports(): Promise<GeneratedReport[]>;
  getReportById(id: number): Promise<GeneratedReport | undefined>;
  getReportByReportId(reportId: string): Promise<GeneratedReport | undefined>;
  getReportsBySimulationId(simulationId: number): Promise<GeneratedReport[]>;
  createReport(report: InsertGeneratedReport): Promise<GeneratedReport>;
  deleteReport(id: number): Promise<void>;

  // Tag methods
  getTagsForSimulation(simulationId: number): Promise<DataTag[]>;
  createTag(tag: InsertDataTag): Promise<DataTag>;
  deleteTag(id: number): Promise<void>;
}

export class DbStorage implements IStorage {
  private data: StorageData;
  private initialized: Promise<void>;

  constructor() {
    this.data = initialData;
    this.initialized = this.init();
  }

  private async init() {
    try {
      const content = await fs.readFile(DATA_FILE, "utf-8");
      const parsed = JSON.parse(content);
      // Revive dates
      parsed.simulations.forEach((s: any) => s.createdAt = new Date(s.createdAt));
      parsed.reports.forEach((r: any) => r.generatedAt = new Date(r.generatedAt));
      parsed.tags.forEach((t: any) => t.createdAt = new Date(t.createdAt));
      this.data = parsed;
      console.log("📂 Loaded persistent data from storage.json");
    } catch (e) {
      console.log("✨ Initializing new persistent storage...");
      await this.persist();
    }
  }

  private async persist() {
    await fs.writeFile(DATA_FILE, JSON.stringify(this.data, null, 2));
  }

  private async ensureInit() {
    await this.initialized;
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    await this.ensureInit();
    return this.data.users.find(u => u.id === id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    await this.ensureInit();
    return this.data.users.find(u => u.username === username);
  }

  async createUser(user: InsertUser): Promise<User> {
    await this.ensureInit();

    // Hash password using scrypt
    const salt = randomBytes(16).toString("hex");
    const hashedPassword = await scryptAsync(user.password, salt, 64) as Buffer;

    const newUser: User = {
      id: `user-${Date.now()}`,
      username: user.username,
      password: `${salt}:${hashedPassword.toString("hex")}`,
      avatar: "marble", // Default avatar style
      createdAt: new Date(),
    };

    this.data.users.push(newUser);
    await this.persist();
    return newUser;
  }


  async getAllSimulations(filters?: { status?: string; search?: string }): Promise<DockingSimulation[]> {
    await this.ensureInit();
    let filtered = [...this.data.simulations];

    if (filters?.status) {
      filtered = filtered.filter(s => s.status === filters.status);
    }

    if (filters?.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(s =>
        s.simulationId.toLowerCase().includes(search) ||
        s.proteinTarget.toLowerCase().includes(search) ||
        s.ligandName.toLowerCase().includes(search)
      );
    }

    return filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getSimulationById(id: number): Promise<DockingSimulation | undefined> {
    await this.ensureInit();
    return this.data.simulations.find(s => s.id === id);
  }

  async getSimulationBySimulationId(simulationId: string): Promise<DockingSimulation | undefined> {
    await this.ensureInit();
    return this.data.simulations.find(s => s.simulationId === simulationId);
  }

  async createSimulation(simulation: InsertDockingSimulation): Promise<DockingSimulation> {
    await this.ensureInit();
    const newSim: DockingSimulation = {
      ...simulation,
      id: this.data.ids.simulation++,
      status: simulation.status || "pending",
      ligandEfficiency: simulation.ligandEfficiency ?? null,
      inhibitionConstant: simulation.inhibitionConstant ?? null,
      interactionData: simulation.interactionData ?? null,
      visualizationUrl: simulation.visualizationUrl ?? null,
      solanaTransactionId: simulation.solanaTransactionId ?? null,
      createdAt: new Date(),
    };
    this.data.simulations.push(newSim);
    await this.persist();
    return newSim;
  }

  async updateSimulation(id: number, updates: Partial<InsertDockingSimulation>): Promise<DockingSimulation | undefined> {
    await this.ensureInit();
    const index = this.data.simulations.findIndex(s => s.id === id);
    if (index === -1) return undefined;

    this.data.simulations[index] = { ...this.data.simulations[index], ...updates };
    await this.persist();
    return this.data.simulations[index];
  }

  async deleteSimulation(id: number): Promise<void> {
    await this.ensureInit();
    const index = this.data.simulations.findIndex(s => s.id === id);
    if (index !== -1) {
      this.data.simulations.splice(index, 1);
      await this.persist();
    }
  }

  // Report methods
  async getAllReports(): Promise<GeneratedReport[]> {
    await this.ensureInit();
    return [...this.data.reports].sort((a, b) => b.generatedAt.getTime() - a.generatedAt.getTime());
  }

  async getReportById(id: number): Promise<GeneratedReport | undefined> {
    await this.ensureInit();
    return this.data.reports.find(r => r.id === id);
  }

  async getReportByReportId(reportId: string): Promise<GeneratedReport | undefined> {
    await this.ensureInit();
    return this.data.reports.find(r => r.reportId === reportId);
  }

  async getReportsBySimulationId(simulationId: number): Promise<GeneratedReport[]> {
    await this.ensureInit();
    return this.data.reports.filter(r => r.simulationId === simulationId);
  }

  async createReport(report: InsertGeneratedReport): Promise<GeneratedReport> {
    await this.ensureInit();
    const newReport: GeneratedReport = {
      ...report,
      id: this.data.ids.report++,
      simulationId: report.simulationId ?? null,
      performanceMetrics: report.performanceMetrics ?? null,
      visualizations: report.visualizations ?? null,
      solanaVerificationHash: report.solanaVerificationHash ?? null,
      generatedAt: new Date(),
    };
    this.data.reports.push(newReport);
    await this.persist();
    return newReport;
  }

  async deleteReport(id: number): Promise<void> {
    await this.ensureInit();
    const index = this.data.reports.findIndex(r => r.id === id);
    if (index !== -1) {
      this.data.reports.splice(index, 1);
      await this.persist();
    }
  }

  // Tag methods
  async getTagsForSimulation(simulationId: number): Promise<DataTag[]> {
    await this.ensureInit();
    return this.data.tags.filter(t => t.simulationId === simulationId);
  }

  async createTag(tag: InsertDataTag): Promise<DataTag> {
    await this.ensureInit();
    const newTag: DataTag = {
      ...tag,
      id: this.data.ids.tag++,
      simulationId: tag.simulationId ?? null,
      createdAt: new Date(),
    };
    this.data.tags.push(newTag);
    await this.persist();
    return newTag;
  }

  async deleteTag(id: number): Promise<void> {
    await this.ensureInit();
    const index = this.data.tags.findIndex(t => t.id === id);
    if (index !== -1) {
      this.data.tags.splice(index, 1);
      await this.persist();
    }
  }
}

export async function comparePassword(supplied: string, stored: string): Promise<boolean> {
  const [salt, hashedPassword] = stored.split(":");
  const suppliedBuffer = await scryptAsync(supplied, salt, 64) as Buffer;
  const storedBuffer = Buffer.from(hashedPassword, "hex");
  return timingSafeEqual(suppliedBuffer, storedBuffer);
}

export const storage = new DbStorage();
