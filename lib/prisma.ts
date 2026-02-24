import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  pgPool?: Pool;
};

function getPool() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is missing.");
  }

  // Reuse pool in dev to avoid creating many connections on hot reload
  if (process.env.NODE_ENV !== "production") {
    if (!globalForPrisma.pgPool) {
      globalForPrisma.pgPool = new Pool({
        connectionString: process.env.DATABASE_URL,
      });
    }
    return globalForPrisma.pgPool;
  }

  // In prod just create once per process
  return new Pool({ connectionString: process.env.DATABASE_URL });
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaPg(getPool()),
    log:
      process.env.NODE_ENV === "production"
        ? ["error"]
        : ["query", "error", "warn"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}