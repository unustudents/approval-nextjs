import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../generated/prisma/client";

async function main() {
  console.log("=== 1. TESTING MYSQL (PRISMA + MARIADB ADAPTER) ===");
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  const url = new URL(connectionString);
  if (url.protocol !== "mysql:" || !url.pathname.slice(1)) {
    throw new Error("DATABASE_URL must be a MySQL URL with a database name");
  }

  const prisma = new PrismaClient({
    adapter: new PrismaMariaDb({
      host: url.hostname,
      port: Number(url.port || 3306),
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database: url.pathname.slice(1),
      connectionLimit: 1,
    }),
  });

  const categories = await prisma.category.findMany({
    select: { id: true, name: true, status: true },
  });
  console.log(
    `[PASS] Connected to MySQL! Found ${categories.length} categories:`,
  );
  categories.forEach((c) => console.log(`   - ${c.name} (${c.status})`));

  const superadmin = await prisma.user.findFirst({
    where: { roles: { some: { role: "SUPERADMIN" } } },
  });
  if (!superadmin) {
    throw new Error("Superadmin user not found in database");
  }
  console.log(
    `[PASS] Superadmin verified in MySQL: ${superadmin.username} (${superadmin.name})`,
  );

  await prisma.$disconnect();
  console.log("\n=== MYSQL VERIFIED END-TO-END SUCCESSFULLY! ===");
}

main().catch((err) => {
  console.error("\n[FAIL] E2E verification error:", err);
  process.exit(1);
});
