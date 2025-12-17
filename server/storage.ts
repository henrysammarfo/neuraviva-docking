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
import { db } from "./db";
import { eq, desc, ilike, and, or } from "drizzle-orm";

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
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  // Docking Simulation methods
  async getAllSimulations(filters?: { status?: string; search?: string }): Promise<DockingSimulation[]> {
    let query = db.select().from(dockingSimulations);
    
    const conditions = [];
    if (filters?.status) {
      conditions.push(eq(dockingSimulations.status, filters.status));
    }
    if (filters?.search) {
      conditions.push(
        or(
          ilike(dockingSimulations.simulationId, `%${filters.search}%`),
          ilike(dockingSimulations.proteinTarget, `%${filters.search}%`),
          ilike(dockingSimulations.ligandName, `%${filters.search}%`)
        )
      );
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    return query.orderBy(desc(dockingSimulations.createdAt));
  }

  async getSimulationById(id: number): Promise<DockingSimulation | undefined> {
    const result = await db.select().from(dockingSimulations).where(eq(dockingSimulations.id, id)).limit(1);
    return result[0];
  }

  async getSimulationBySimulationId(simulationId: string): Promise<DockingSimulation | undefined> {
    const result = await db.select().from(dockingSimulations).where(eq(dockingSimulations.simulationId, simulationId)).limit(1);
    return result[0];
  }

  async createSimulation(simulation: InsertDockingSimulation): Promise<DockingSimulation> {
    const result = await db.insert(dockingSimulations).values(simulation).returning();
    return result[0];
  }

  async updateSimulation(id: number, updates: Partial<InsertDockingSimulation>): Promise<DockingSimulation | undefined> {
    const result = await db.update(dockingSimulations).set(updates).where(eq(dockingSimulations.id, id)).returning();
    return result[0];
  }

  async deleteSimulation(id: number): Promise<void> {
    await db.delete(dockingSimulations).where(eq(dockingSimulations.id, id));
  }

  // Report methods
  async getAllReports(): Promise<GeneratedReport[]> {
    return db.select().from(generatedReports).orderBy(desc(generatedReports.generatedAt));
  }

  async getReportById(id: number): Promise<GeneratedReport | undefined> {
    const result = await db.select().from(generatedReports).where(eq(generatedReports.id, id)).limit(1);
    return result[0];
  }

  async getReportByReportId(reportId: string): Promise<GeneratedReport | undefined> {
    const result = await db.select().from(generatedReports).where(eq(generatedReports.reportId, reportId)).limit(1);
    return result[0];
  }

  async getReportsBySimulationId(simulationId: number): Promise<GeneratedReport[]> {
    return db.select().from(generatedReports).where(eq(generatedReports.simulationId, simulationId));
  }

  async createReport(report: InsertGeneratedReport): Promise<GeneratedReport> {
    const result = await db.insert(generatedReports).values(report).returning();
    return result[0];
  }

  async deleteReport(id: number): Promise<void> {
    await db.delete(generatedReports).where(eq(generatedReports.id, id));
  }

  // Tag methods
  async getTagsForSimulation(simulationId: number): Promise<DataTag[]> {
    return db.select().from(dataTags).where(eq(dataTags.simulationId, simulationId));
  }

  async createTag(tag: InsertDataTag): Promise<DataTag> {
    const result = await db.insert(dataTags).values(tag).returning();
    return result[0];
  }

  async deleteTag(id: number): Promise<void> {
    await db.delete(dataTags).where(eq(dataTags.id, id));
  }
}

export const storage = new DbStorage();
