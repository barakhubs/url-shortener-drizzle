import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

// Single connection pool shared across the entire server process.
// postgres() manages pooling internally; max defaults to 10 connections.
const client = postgres(process.env.DATABASE_URL);

export const db = drizzle(client, { schema });
