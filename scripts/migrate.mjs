import fs from "node:fs/promises";
import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL não configurada.");
const sql = neon(process.env.DATABASE_URL);
const migration = await fs.readFile(new URL("../db/migrations/0001_initial.sql", import.meta.url), "utf8");
const statements = migration.split(/;\s*(?:\n|$)/).map((s) => s.trim()).filter(Boolean);
for (const statement of statements) await sql.query(statement);
console.log(`Migration 0001 aplicada (${statements.length} statements).`);
