import { sql } from "drizzle-orm";
import { pgTable, text, varchar, serial, real, timestamp, jsonb, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  avatar: text("avatar").notNull().default("marble"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Session Table (for connect-pg-simple)
export const session = pgTable("session", {
  sid: varchar("sid").primaryKey(),
  sess: jsonb("sess").notNull(),
  expire: timestamp("expire").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Docking Simulations Table
export const dockingSimulations = pgTable("docking_simulations", {
  id: serial("id").primaryKey(),
  simulationId: text("simulation_id").notNull().unique(),
  proteinTarget: text("protein_target").notNull(),
  ligandName: text("ligand_name").notNull(),
  bindingAffinity: real("binding_affinity").notNull(),
  rmsd: real("rmsd").notNull(),
  status: text("status").notNull().default("pending"),
  ligandEfficiency: real("ligand_efficiency"),
  inhibitionConstant: real("inhibition_constant"),
  interactionData: jsonb("interaction_data"),
  visualizationUrl: text("visualization_url"),
  solanaTransactionId: text("solana_transaction_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertDockingSimulationSchema = createInsertSchema(dockingSimulations).omit({
  id: true,
  createdAt: true,
});

export type InsertDockingSimulation = z.infer<typeof insertDockingSimulationSchema>;
export type DockingSimulation = typeof dockingSimulations.$inferSelect;

// Generated Reports Table
export const generatedReports = pgTable("generated_reports", {
  id: serial("id").primaryKey(),
  reportId: text("report_id").notNull().unique(),
  simulationId: integer("simulation_id").references(() => dockingSimulations.id),
  title: text("title").notNull(),
  executiveSummary: text("executive_summary").notNull(),
  fullContent: text("full_content").notNull(),
  performanceMetrics: jsonb("performance_metrics"),
  visualizations: jsonb("visualizations"),
  solanaVerificationHash: text("solana_verification_hash"),
  generatedAt: timestamp("generated_at").defaultNow().notNull(),
});

export const insertGeneratedReportSchema = createInsertSchema(generatedReports).omit({
  id: true,
  generatedAt: true,
});

export type InsertGeneratedReport = z.infer<typeof insertGeneratedReportSchema>;
export type GeneratedReport = typeof generatedReports.$inferSelect;

// Data Tags for Categorization
export const dataTags = pgTable("data_tags", {
  id: serial("id").primaryKey(),
  simulationId: integer("simulation_id").references(() => dockingSimulations.id),
  tagType: text("tag_type").notNull(),
  tagValue: text("tag_value").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertDataTagSchema = createInsertSchema(dataTags).omit({
  id: true,
  createdAt: true,
});

export type InsertDataTag = z.infer<typeof insertDataTagSchema>;
export type DataTag = typeof dataTags.$inferSelect;
