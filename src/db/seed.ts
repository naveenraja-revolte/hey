import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db, schema } from '@/db';

async function main() {
  const name = process.env.INITIAL_ADMIN_NAME?.trim();
  const email = process.env.INITIAL_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.INITIAL_ADMIN_PASSWORD;

  if (!name || !email || !password) {
    throw new Error(
      'Set INITIAL_ADMIN_NAME, INITIAL_ADMIN_EMAIL, and INITIAL_ADMIN_PASSWORD before bootstrapping the first administrator.',
    );
  }

  if (password.length < 12) {
    throw new Error('INITIAL_ADMIN_PASSWORD must contain at least 12 characters.');
  }

  const [existingAdmin] = db
    .select({ id: schema.user.id })
    .from(schema.user)
    .where(eq(schema.user.role, 'admin'))
    .limit(1)
    .all();

  if (existingAdmin) {
    throw new Error('An administrator already exists. Initial administrator setup can only run once.');
  }

  const result = await auth.api.signUpEmail({
    body: { name, email, password },
  });

  db.update(schema.user)
    .set({ role: 'admin' })
    .where(eq(schema.user.id, result.user.id))
    .run();

  console.info('Initial administrator created. Remove the bootstrap credentials from the environment.');
}

main().catch((error: unknown) => {
  console.error('Administrator bootstrap failed:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
