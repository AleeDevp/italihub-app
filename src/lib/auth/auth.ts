import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { nextCookies } from 'better-auth/next-js';

import { prisma } from '../db';
import { sendEmail } from '../email/resend';

const baseURL: string | undefined =
  process.env.VERCEL === '1'
    ? process.env.VERCEL_ENV === 'production'
      ? process.env.BETTER_AUTH_URL
      : process.env.VERCEL_ENV === 'preview'
        ? `https://${process.env.VERCEL_URL}`
        : undefined
    : undefined;

export const auth = betterAuth({
  appName: 'ItaliHub',
  baseURL,
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),

  // Control which origins/callback URLs are trusted by Better Auth
  // This prevents open-redirect and CSRF issues. In development, we also allow
  // private LAN origins so you can use your phone (e.g., http://192.168.x.x:3000).
  trustedOrigins: async (request) => {
    const origins = new Set<string>();

    // Always include localhost for dev
    origins.add('http://localhost:3000');
    origins.add('http://127.0.0.1:3000');

    // Include configured baseURL when present (Vercel/production or preview)
    if (baseURL) {
      origins.add(baseURL);
    }

    // Allow additional explicit origins via env (comma-separated)
    const extra =
      process.env.EXTRA_TRUSTED_ORIGINS?.split(',')
        .map((s) => s.trim())
        .filter(Boolean) ?? [];
    for (const e of extra) origins.add(e);

    // In non-production, also trust the current private LAN origin to support mobile testing
    if (process.env.NODE_ENV !== 'production') {
      const originHeader = request.headers.get('origin');
      if (originHeader) {
        try {
          const u = new URL(originHeader);
          const host = u.hostname;
          const isPrivateLan =
            host === 'localhost' ||
            host === '127.0.0.1' ||
            host.startsWith('10.') ||
            host.startsWith('192.168.') ||
            (host.startsWith('172.') &&
              (() => {
                const parts = host.split('.');
                const second = Number(parts[1]);
                return Number.isFinite(second) && second >= 16 && second <= 31;
              })());
          if (isPrivateLan) {
            origins.add(`${u.protocol}//${u.host}`);
          }
        } catch {
          // ignore malformed origin header
        }
      }
    }

    return Array.from(origins);
  },

  rateLimit: {
    storage: 'database',
    modelName: 'rateLimit',
    enabled: true,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day (every 1 day the session expiration is updated)
    freshAge: 60 * 30, // 30 minutes (the session is fresh if created within the last 30 minutes)
    // cookieCache: {
    //   enabled: true,
    //   maxAge: 15 * 60, // Cache duration in seconds
    // },
  },

  // Keep default error handling - just log and re-throw
  // onAPIError: {
  //   throw: true,
  //   onError(error, ctx) {
  //     console.error('[Better Auth] API Error:', error);
  //     throw error;
  //   },
  // },

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    async sendResetPassword({ user, url }) {
      // Send the reset email
      await sendEmail({
        from: 'reset',
        to: user.email,
        subject: 'Reset your password',
        text: `Click the following link to reset your password: ${url}`,
      });

      // Log password reset request
      const { AuthAuditor } = await import('../audit/audit');
      await AuthAuditor.logPasswordResetRequest(user.email, user.id, {
        email: user.email,
      });
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      mapProfileToUser: (profile) => {
        return {
          firstName: profile.given_name,
          lastName: profile.family_name,
        };
      },
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true, // auto-send after sign up
    async sendVerificationEmail({ user, url }) {
      await sendEmail({
        from: 'verify',
        to: user.email,
        subject: 'Verify your email address',
        text: `Welcome to ItaliHub! Please verify your email by clicking the following link: ${url}`,
      });
    },
  },
  account: {
    accountLinking: {
      enabled: true, // Required: Enables the feature globally
      trustedProviders: ['google'], // Add Google here for automatic linking (can include others like "github")
      allowDifferentEmails: false, // Default; set to true if you want to allow linking with mismatched emails (not recommended for security)
      updateUserInfoOnLink: true, // Optional: Updates user profile (e.g., name, image) from Google during linking
    },
  },
  user: {
    additionalFields: {
      role: {
        type: 'string',
        required: false,
        defaultValue: 'USER',
        input: false, // don't allow user to set role
      },
      isProfileComplete: {
        type: 'boolean',
        required: false,
        defaultValue: false,
        input: false, // don't allow user to set this
      },
      userId: {
        type: 'string',
        required: false,
        input: true,
      },
      telegramHandle: {
        type: 'string',
        required: false,
        input: true,
      },
      cityId: {
        type: 'number',
        required: false,
        input: true,
      },
      cityLastChangedAt: {
        type: 'date',
        required: false,
        input: false,
      },
      verified: {
        type: 'boolean',
        required: false,
        defaultValue: false,
        input: false,
      },
      verifiedAt: {
        type: 'date',
        required: false,
        input: false,
      },
    },
  },

  databaseHooks: {
    user: {
      create: {
        after: async (user: any) => {
          // Import audit functions dynamically to avoid circular dependencies
          const { AuthAuditor } = await import('../audit/audit');
          await AuthAuditor.logRegistrationSuccess(user.email, user.id, {
            emailVerified: user.emailVerified,
            provider: 'email',
          });
        },
      },
    },
    session: {
      create: {
        after: async (session: any) => {
          const { AuthAuditor } = await import('../audit/audit');
          await AuthAuditor.logLoginSuccess(session.userId, session.id, {
            provider: 'session',
          });
        },
      },
      delete: {
        after: async (session: any) => {
          const { AuthAuditor } = await import('../audit/audit');
          await AuthAuditor.logLogoutSuccess(session.userId, session.id, {
            provider: 'session',
          });
        },
      },
    },
  },

  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;

export { getCurrentUser, requireUser } from './require-user';
