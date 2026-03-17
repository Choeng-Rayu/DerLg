import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // For Supabase, the CLI (Migrations) must use the DIRECT session connection string (port 5432)
    // to bypass the connection pooler.
    url:process.env["DIRECT_URL"],
  },
});
