import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";

import {
  rateLimitLogin,
  resetLoginRateLimit,
} from "@/lib/rate-limit";

function getLoginIdentifier(
  request: Request,
  email: string
) {
  const forwardedFor =
    request.headers.get("x-forwarded-for");

  const ip =
    forwardedFor
      ?.split(",")[0]
      ?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  return `${ip}:${email}`;
}

export const {
  handlers,
  signIn,
  signOut,
  auth,
} = NextAuth({
  providers: [
    Credentials({
      name: "Credentials",

      credentials: {
        email: {
          label: "Email",
          type: "email",
        },

        password: {
          label: "Password",
          type: "password",
        },
      },

      async authorize(
        credentials,
        request
      ) {
        if (
          !credentials?.email ||
          !credentials?.password
        ) {
          return null;
        }

        const email =
          String(
            credentials.email
          )
            .trim()
            .toLowerCase();

        const password =
          String(
            credentials.password
          );

        const identifier =
          getLoginIdentifier(
            request,
            email
          );

        const rateLimit =
          await rateLimitLogin(
            identifier
          );

        if (!rateLimit.success) {
          console.warn(
            "Login rate limit exceeded."
          );

          return null;
        }

        const user =
          await prisma.user.findUnique({
            where: {
              email,
            },

            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              passwordHash: true,
              emailVerified: true,
            },
          });

        if (
          !user ||
          !user.passwordHash
        ) {
          return null;
        }

        const passwordMatches =
          await bcrypt.compare(
            password,
            user.passwordHash
          );

        if (!passwordMatches) {
          return null;
        }

        if (!user.emailVerified) {
          console.warn(
            "Login blocked for unverified email."
          );

          return null;
        }

        await resetLoginRateLimit(
          identifier
        );

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],

  session: {
    strategy: "jwt",
  },

  callbacks: {
    async jwt({
      token,
      user,
    }) {
      /*
       * New login.
       */
      if (user?.id) {
        const currentUser =
          await prisma.user.findUnique({
            where: {
              id: user.id,
            },

            select: {
              role: true,
              authVersion: true,
              emailVerified: true,
            },
          });

        if (
          !currentUser ||
          !currentUser.emailVerified
        ) {
          return {
            ...token,
            id: undefined,
            role: undefined,
            authVersion: undefined,
          };
        }

        token.id =
          user.id;

        token.role =
          currentUser.role;

        token.authVersion =
          currentUser.authVersion;

        return token;
      }

      /*
       * Existing JWT.
       */
      if (!token.id) {
        return token;
      }

      const currentUser =
        await prisma.user.findUnique({
          where: {
            id:
              token.id as string,
          },

          select: {
            role: true,
            authVersion: true,
            emailVerified: true,
          },
        });

      if (
        !currentUser ||
        !currentUser.emailVerified
      ) {
        return {
          ...token,
          id: undefined,
          role: undefined,
          authVersion: undefined,
        };
      }

      const tokenAuthVersion =
        typeof token.authVersion ===
        "number"
          ? token.authVersion
          : 0;

      /*
       * Password changes increment
       * authVersion, invalidating
       * previously issued JWTs.
       */
      if (
        tokenAuthVersion !==
        currentUser.authVersion
      ) {
        return {
          ...token,
          id: undefined,
          role: undefined,
          authVersion: undefined,
        };
      }

      /*
       * Keep the user's role synchronized
       * with the database.
       */
      token.role =
        currentUser.role;

      return token;
    },

    async session({
      session,
      token,
    }) {
      if (
        session.user &&
        token.id
      ) {
        session.user.id =
          token.id as string;

        session.user.role =
          token.role as
            | "USER"
            | "ADMIN";
      }

      return session;
    },
  },

  pages: {
    signIn: "/login",
  },
});