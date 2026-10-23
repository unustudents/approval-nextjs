import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

async function main() {
  console.log("=== 1. TESTING NEON POSTGRES (PRISMA + PG ADAPTER) ===");
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });

  const categories = await prisma.category.findMany({
    select: { id: true, name: true, status: true },
  });
  console.log(
    `[PASS] Connected to Neon Postgres! Found ${categories.length} categories:`,
  );
  categories.forEach((c) => console.log(`   - ${c.name} (${c.status})`));

  const superadmin = await prisma.user.findFirst({
    where: { role: "SUPERADMIN" },
  });
  if (!superadmin) {
    throw new Error("Superadmin user not found in database");
  }
  console.log(
    `[PASS] Superadmin verified in Neon Postgres: ${superadmin.username} (${superadmin.name})`,
  );

  console.log("\n=== 2. TESTING NEON OBJECT STORAGE (S3 COMPATIBLE) ===");
  const endpoint = process.env.AWS_ENDPOINT_URL_S3;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const region = process.env.AWS_REGION || "ap-southeast-1";
  const bucket = process.env.NEON_STORAGE_BUCKET || "assets";

  console.log(`Endpoint : ${endpoint}`);
  console.log(`Bucket   : ${bucket}`);
  console.log(`Region   : ${region}`);

  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error("Neon Object Storage environment variables are missing");
  }

  const s3 = new S3Client({
    region,
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: true,
  });

  const testKey = `test-verification/e2e-${Date.now()}.txt`;
  const testPayload = `Office Approval E2E verification test payload on Neon Object Storage: ${new Date().toISOString()}`;

  console.log(`Uploading test file to ${testKey}...`);
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: testKey,
      Body: Buffer.from(testPayload, "utf-8"),
      ContentType: "text/plain",
    }),
  );
  console.log("[PASS] Upload to Neon Object Storage succeeded!");

  console.log("Downloading test file from Neon Object Storage...");
  const getRes = await s3.send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: testKey,
    }),
  );

  const downloadedBytes = await getRes.Body!.transformToByteArray();
  const downloadedText = Buffer.from(downloadedBytes).toString("utf-8");

  if (downloadedText !== testPayload) {
    throw new Error("Downloaded content does not match uploaded payload!");
  }
  console.log(
    `[PASS] Downloaded and verified content: "${downloadedText.slice(0, 50)}..."`,
  );

  console.log("Cleaning up test object...");
  await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: testKey }));
  console.log("[PASS] Cleaned up test object from Neon Object Storage.");

  await prisma.$disconnect();
  console.log("\n=== ALL NEON SERVICES VERIFIED END-TO-END SUCCESSFULLY! ===");
}

main().catch((err) => {
  console.error("\n[FAIL] E2E verification error:", err);
  process.exit(1);
});
