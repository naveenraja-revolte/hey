import "dotenv/config";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { getDatabase } from "@/db/database";
import { staffUsers } from "@/db/schema";
import { passwordHash } from "@/lib/auth-service";
import { staffSignInSchema } from "@/lib/validation";

function requireCredential(name: "ADMIN_EMAIL" | "ADMIN_PASSWORD"): string {
  const value = process.env[name]?.trim();
  if (!value)
    throw new Error(`${name} must be set before bootstrapping staff.`);
  return value;
}

const credentials = staffSignInSchema.safeParse({
  email: requireCredential("ADMIN_EMAIL"),
  password: requireCredential("ADMIN_PASSWORD"),
});
if (!credentials.success)
  throw new Error("ADMIN_EMAIL or ADMIN_PASSWORD is invalid.");
if (credentials.data.password.length < 12) {
  throw new Error("ADMIN_PASSWORD must be at least 12 characters.");
}
if (!process.env.AUTH_SECRET || process.env.AUTH_SECRET.length < 32) {
  throw new Error(
    "AUTH_SECRET must be configured with at least 32 characters.",
  );
}
const email = credentials.data.email.toLowerCase();
const password = credentials.data.password;

const { client, db } = getDatabase();
try {
  const existing = db
    .select({ id: staffUsers.id })
    .from(staffUsers)
    .where(eq(staffUsers.email, email))
    .get();
  if (existing)
    throw new Error("A staff account already exists for ADMIN_EMAIL.");

  db.insert(staffUsers)
    .values({
      id: randomUUID(),
      email,
      passwordHash: passwordHash(password),
      createdAt: new Date().toISOString(),
    })
    .run();
  process.stdout.write(`Created the staff account for ${email}.\n`);
} finally {
  client.close();
}
