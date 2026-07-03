import { defineConfig, env } from "prisma/config";

loadEnvFile(".env");
loadEnvFile(".env.local");

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});

function loadEnvFile(path: string) {
  try {
    process.loadEnvFile?.(path);
  } catch {
    // Env files are optional in packaged deployments.
  }
}
