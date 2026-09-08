import crypto from "crypto";

import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

function getAppUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

function redirectToLogin(
  params: string
) {
  const appUrl = getAppUrl();

  return NextResponse.redirect(
    `${appUrl}/login?${params}`
  );
}

export async function GET(
  request: Request
) {
  try {
    const url =
      new URL(request.url);

    const rawToken =
      url.searchParams.get(
        "token"
      );

    const email =
      (
        url.searchParams.get(
          "email"
        ) || ""
      )
        .trim()
        .toLowerCase();

    if (
      !rawToken ||
      !email
    ) {
      return redirectToLogin(
        "verification=invalid"
      );
    }

    if (
      rawToken.length !== 64 ||
      email.length > 254
    ) {
      return redirectToLogin(
        "verification=invalid"
      );
    }

    if (
      !/^[a-f0-9]{64}$/i.test(
        rawToken
      )
    ) {
      return redirectToLogin(
        "verification=invalid"
      );
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email
      )
    ) {
      return redirectToLogin(
        "verification=invalid"
      );
    }

    const hashedToken =
      crypto
        .createHash(
          "sha256"
        )
        .update(rawToken)
        .digest("hex");

    const verificationToken =
      await prisma.verificationToken.findUnique({
        where: {
          token:
            hashedToken,
        },

        select: {
          identifier: true,
          token: true,
          expires: true,
        },
      });

    if (
      !verificationToken ||
      verificationToken.identifier !==
        email
    ) {
      return redirectToLogin(
        "verification=invalid"
      );
    }

    if (
      verificationToken.expires <=
      new Date()
    ) {
      await prisma.verificationToken.deleteMany({
        where: {
          identifier:
            email,
        },
      });

      return redirectToLogin(
        "verification=expired"
      );
    }

    const user =
      await prisma.user.findUnique({
        where: {
          email,
        },

        select: {
          id: true,
          emailVerified: true,
        },
      });

    if (!user) {
      await prisma.verificationToken.deleteMany({
        where: {
          identifier:
            email,
        },
      });

      return redirectToLogin(
        "verification=invalid"
      );
    }

    if (
      !user.emailVerified
    ) {
      await prisma.$transaction(
        async (tx) => {
          await tx.user.update({
            where: {
              id: user.id,
            },

            data: {
              emailVerified:
                new Date(),
            },
          });

          await tx.verificationToken.deleteMany({
            where: {
              identifier:
                email,
            },
          });
        }
      );
    } else {
      await prisma.verificationToken.deleteMany({
        where: {
          identifier:
            email,
        },
      });
    }

    return redirectToLogin(
      "verified=true"
    );
  } catch (error) {
    console.error(
      "Email verification error:",
      error
    );

    return redirectToLogin(
      "verification=error"
    );
  }
}
