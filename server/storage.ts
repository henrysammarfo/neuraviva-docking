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
} from "../shared/schema.js";

import { drizzle } from "drizzle-orm/node-postgres";
import { eq, desc, like, or } from "drizzle-orm";
import pg from "pg";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

// Password hashing
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
  return salt + ":" + derivedKey.toString("hex");
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  const [salt, storedHash] = hash.split(":");
  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
  const hashBuffer = Buffer.from(storedHash, "hex");
  return timingSafeEqual(derivedKey, hashBuffer);
}

// Database connection
const connectionString = process.env.DATABASE_URL;

if (!connectionString && (process.env.NODE_ENV === "production" || process.env.VERCEL)) {
  const errorMsg = "❌ CRITICAL: DATABASE_URL is not set. Database operations will fail. Please add this variable to your Vercel project settings.";
  console.error(errorMsg);
  // On Vercel, we want this to be loud and clear in the logs
  if (process.env.VERCEL) {
    throw new Error(errorMsg);
  }
}

const pool = new pg.Pool({
  connectionString: connectionString || "",
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false
});

// Production DB Observability
console.log(`[storage] Initializing DB Pool. Connection string present: ${!!connectionString}`);
if (connectionString) {
  const redacted = connectionString.replace(/:([^@]+)@/, ":****@");
  console.log(`[storage] DB Endpoint: ${redacted.split('@')[1] || 'parse_fail'}`);
}

const db = drizzle(pool);

// Pre-flight Pulse Check
(async () => {
  try {
    console.log("[storage] 🩺 Starting DB Pulse Check...");
    const result = await db.execute(sql`SELECT 1`);
    if (result) {
      console.log("[storage] ✅ DB Pulse Check PASSED. Connection is healthy.");
    }
  } catch (err: any) {
    console.error("[storage] ❌ DB Pulse Check FAILED!");
    console.error(`[storage] Error: ${err.message}`);
    if (err.detail) console.error(`[storage] Detail: ${err.detail}`);
    if (err.code) console.error(`[storage] Postgres Code: ${err.code}`);
  }
})();

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;

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

  async createUser(user: InsertUser): Promise<User> {
    const hashedPassword = await hashPassword(user.password);
    const result = await db.insert(users).values({
      username: user.username,
      password: hashedPassword,
      avatar: "marble"
    }).returning();
    return result[0];
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    try {
      // Remove sensitive or non-updatable fields if they exist in updates
      const updatable = { ...updates };
      delete (updatable as any).id;
      delete (updatable as any).password;
      delete (updatable as any).username;
      delete (updatable as any).createdAt;

      console.log(`[storage] Updating user ${id} with:`, updatable);
      const result = await db.update(users).set(updatable).where(eq(users.id, id)).returning();
      return result[0];
    } catch (error: any) {
      console.error(`[storage] Error updating user ${id}:`, error);
      throw error;
    }
  }

  // Simulation methods
  async getAllSimulations(filters?: { status?: string; search?: string }): Promise<DockingSimulation[]> {
    let query = db.select().from(dockingSimulations);

    if (filters?.status) {
      query = query.where(eq(dockingSimulations.status, filters.status)) as typeof query;
    }

    if (filters?.search) {
      query = query.where(
        or(
          like(dockingSimulations.proteinTarget, `%${filters.search}%`),
          like(dockingSimulations.ligandName, `%${filters.search}%`)
        )
      ) as typeof query;
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
