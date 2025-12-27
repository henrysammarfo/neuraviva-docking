import { defineConfig } from "drizzle-kit";

// DATABASE_URL is required for db:push command
const connectionString = process.env.DATABASE_URL || "";


export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: connectionString,
  },
});
