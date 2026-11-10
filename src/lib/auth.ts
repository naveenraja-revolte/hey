import { drizzleAdapter } from '@better-auth/drizzle-adapter';
import { betterAuth } from 'better-auth';
import { nextCookies } from 'better-auth/next-js';
import { db } from '@/db';

const secret = process.env.BETTER_AUTH_SECRET;

if (!secret || secret.length < 32) {
  throw new Error('BETTER_AUTH_SECRET must be set to a random value of at least 32 characters.');
}

const baseURL = process.env.BETTER_AUTH_URL ?? 'http://localhost:3000';

export const auth = betterAuth({
  appName: 'Dispatch Desk',
  baseURL,
  secret,
  trustedOrigins: [baseURL],
  database: drizzleAdapter(db, {
    provider: 'sqlite',
    transaction: true,
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
  },
  user: {
    additionalFields: {
      role: {
        type: 'string',
        required: true,
        defaultValue: 'member',
        input: false,
      },
    },
  },
  rateLimit: {
    enabled: true,
    window: 60,
    max: 100,
    storage: 'database',
    customRules: {
      '/sign-up/email': {
        window: 60,
        max: 5,
      },
      '/sign-in/email': {
        window: 60,
        max: 5,
      },
    },
  },
  plugins: [nextCookies()],
});
