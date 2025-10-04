import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { nextCookies } from 'better-auth/next-js';

import { prisma } from './db';
import { sendEmail } from './email/resend';

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
      const { AuthAuditor } = await import('./audit');
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
          const { AuthAuditor } = await import('./audit');
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
          const { AuthAuditor } = await import('./audit');
          await AuthAuditor.logLoginSuccess(session.userId, session.id, {
            provider: 'session',
          });
        },
      },
      delete: {
        after: async (session: any) => {
          const { AuthAuditor } = await import('./audit');
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
