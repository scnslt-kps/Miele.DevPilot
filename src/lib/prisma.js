import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

loadEnvFile(".env");
loadEnvFile(".env.local");

const globalForPrisma = globalThis;
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

export const prisma =
  globalForPrisma.__mieleDevPilotPrisma ||
  new PrismaClient({
    adapter,
    log: process.env.PRISMA_QUERY_LOG === "true" ? ["query", "error", "warn"] : ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.__mieleDevPilotPrisma = prisma;
}

function loadEnvFile(path) {
  try {
    process.loadEnvFile?.(path);
  } catch {
    // Env files are optional in packaged deployments.
  }
}
