import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "./generated/prisma/client.js";
import { config } from "./config.js";

const pool = new Pool({
  connectionString: config.databaseUrl,
  ssl: false,
  max: 10,
  application_name: "smart-ticket-allocation-service",
});

pool.on("error", (error) => {
  console.error("PostgreSQL pool error", error);
});

const adapter = new PrismaPg(pool, {
  disposeExternalPool: true,
  onPoolError: (error) => console.error("Prisma PostgreSQL adapter error", error),
});

export const prisma = new PrismaClient({ adapter });
