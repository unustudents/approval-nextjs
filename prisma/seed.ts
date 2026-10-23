import "dotenv/config";
import { hash } from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const connectionString =
  process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL ?? "";
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
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
    role: "SUPERADMIN",
    status: "ACTIVE",
    unitId: null,
  },
  create: { username, passwordHash, name, role: "SUPERADMIN" },
});

const categoryNames = [
  "Perangkat TI",
  "Elektronik",
  "Barang Medis",
  "Barang Rumah Tangga",
  "Lainnya",
];

for (const categoryName of categoryNames) {
  const category = await prisma.category.upsert({
    where: { name: categoryName },
    update: { status: "ACTIVE" },
    create: { name: categoryName },
  });

  await prisma.workflow.upsert({
    where: { categoryId: category.id },
    update: { name: `Workflow ${categoryName}`, status: "ACTIVE" },
    create: {
      name: `Workflow ${categoryName}`,
      categoryId: category.id,
      steps: {
        create: [
          {
            order: 1,
            type: "APPROVAL",
            targetType: "UNIT_MANAGER",
            allowRevision: true,
          },
          {
            order: 2,
            type: "APPROVAL",
            targetType: "ROLE",
            targetRole: "FINANCE_APPROVER",
            allowRevision: true,
          },
        ],
      },
    },
  });
}

await prisma.$disconnect();
