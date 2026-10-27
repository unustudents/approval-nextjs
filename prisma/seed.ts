import "dotenv/config";
import { hash } from "bcryptjs";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL ?? "";
if (!connectionString) {
  throw new Error("DATABASE_URL is required");
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

const username = process.env.SUPERADMIN_USERNAME?.trim().toLowerCase();
const password = process.env.SUPERADMIN_PASSWORD;
const name =
  process.env.SUPERADMIN_NAME?.trim() || "Office Approval Administrator";

if (!username || !password || password.length < 4) {
  throw new Error(
    "Set SUPERADMIN_USERNAME and a SUPERADMIN_PASSWORD of at least 4 characters",
  );
}

const passwordHash = await hash(password, 12);

await prisma.user.upsert({
  where: { username },
  update: {
    passwordHash,
    name,
    roles: { deleteMany: {}, create: [{ role: "SUPERADMIN" }] },
    status: "ACTIVE",
    unitId: null,
  },
  create: { username, passwordHash, name, roles: { create: [{ role: "SUPERADMIN" }] } },
});

const categoryNames = [
  "Perangkat TI",
  "Elektronik",
  "Barang Medis",
  "Barang Rumah Tangga",
  "Lainnya",
];

for (const categoryName of categoryNames) {
  await prisma.category.upsert({
    where: { name: categoryName },
    update: { status: "ACTIVE" },
    create: { name: categoryName },
  });

}

await prisma.$disconnect();
