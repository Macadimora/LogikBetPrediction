import crypto from "crypto";

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { Resend } from "resend";

import { prisma } from "@/lib/prisma";
import { rateLimitRegistration } from "@/lib/rate-limit";

function getClientIdentifier(
  request: Request,
  email: string
) {
  const forwardedFor =
    request.headers.get(
      "x-forwarded-for"
    );

  const ip =
    forwardedFor
      ?.split(",")[0]
      ?.trim() ||
    request.headers.get(
      "x-real-ip"
    ) ||
    "unknown";

  return `${ip}:${email}`;
}

function escapeHtml(
  value: string
) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function POST(
  request: Request
) {
  try {
    const body =
      await request.json();

    const name =
      String(
        body.name ?? ""
      ).trim();

    const email =
      String(
        body.email ?? ""
      )
        .trim()
        .toLowerCase();

    const password =
      String(
        body.password ?? ""
      );

    if (
      !name ||
      !email ||
      !password
    ) {
      return NextResponse.json(
        {
          error:
            "Name, email and password are required.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      name.length < 2 ||
      name.length > 100
    ) {
      return NextResponse.json(
        {
          error:
            "Name must be between 2 and 100 characters.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email
      ) ||
      email.length > 254
    ) {
      return NextResponse.json(
        {
          error:
            "Please provide a valid email address.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      password.length < 8
    ) {
      return NextResponse.json(
        {
          error:
            "Password must be at least 8 characters.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      password.length > 128
    ) {
      return NextResponse.json(
        {
          error:
            "Password must not exceed 128 characters.",
        },
        {
          status: 400,
        }
      );
    }

    const rateLimitIdentifier =
      getClientIdentifier(
        request,
        email
      );

    const rateLimit =
      await rateLimitRegistration(
        rateLimitIdentifier
      );

    if (!rateLimit.success) {
      const retryAfterSeconds =
        Math.max(
          1,
          Math.ceil(
            (
              rateLimit.reset -
              Date.now()
            ) / 1000
          )
        );

      return NextResponse.json(
        {
          error:
            "Too many registration attempts. Please try again later.",
        },
        {
          status: 429,

          headers: {
            "Retry-After":
              String(
                retryAfterSeconds
              ),

            "X-RateLimit-Limit":
              String(
                rateLimit.limit
              ),

            "X-RateLimit-Remaining":
              String(
                rateLimit.remaining
              ),

            "X-RateLimit-Reset":
              String(
                rateLimit.reset
              ),
          },
        }
      );
    }

    const existingUser =
      await prisma.user.findUnique({
        where: {
          email,
        },

        select: {
          id: true,
          name: true,
          email: true,
          emailVerified: true,
          passwordHash: true,
          role: true,
          createdAt: true,
        },
      });

    if (
      existingUser?.emailVerified
    ) {
      return NextResponse.json(
        {
          error:
            "An account with this email already exists.",
        },
        {
          status: 409,
        }
      );
    }

    const resendApiKey =
      process.env.RESEND_API_KEY;

    const emailFrom =
      process.env.RESET_EMAIL_FROM;

    if (
      !resendApiKey ||
      !emailFrom
    ) {
      console.error(
        "Email verification configuration is missing."
      );

      return NextResponse.json(
        {
          error:
            "Account registration is temporarily unavailable.",
        },
        {
          status: 500,
        }
      );
    }

    const rawVerificationToken =
      crypto
        .randomBytes(32)
        .toString("hex");

    const hashedVerificationToken =
      crypto
        .createHash(
          "sha256"
        )
        .update(
          rawVerificationToken
        )
        .digest("hex");

    const verificationExpires =
      new Date(
        Date.now() +
          30 * 60 * 1000
      );

    const appUrl =
      process.env
        .NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000";

    const verificationUrl =
      `${appUrl}/api/auth/verify-email` +
      `?token=${encodeURIComponent(
        rawVerificationToken
      )}` +
      `&email=${encodeURIComponent(
        email
      )}`;

    let user:
      | {
          id: string;
          name: string | null;
          email: string | null;
          role: "USER" | "ADMIN";
          createdAt: Date;
        }
      | null = null;

    let createdNewUser =
      false;

    if (existingUser) {
      user = {
        id: existingUser.id,
        name: existingUser.name,
        email: existingUser.email,
        role: existingUser.role,
        createdAt:
          existingUser.createdAt,
      };
    } else {
      const passwordHash =
        await bcrypt.hash(
          password,
          12
        );

      user =
        await prisma.user.create({
          data: {
            name,
            email,
            passwordHash,
            role: "USER",
          },

          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
          },
        });

      createdNewUser =
        true;
    }

    await prisma.$transaction(
      async (tx) => {
        await tx.verificationToken.deleteMany({
          where: {
            identifier:
              email,
          },
        });

        await tx.verificationToken.create({
          data: {
            identifier:
              email,
            token:
              hashedVerificationToken,
            expires:
              verificationExpires,
          },
        });
      }
    );

    const safeName =
      escapeHtml(
        user.name || name
      );

    const safeVerificationUrl =
      escapeHtml(
        verificationUrl
      );

    const resend =
      new Resend(
        resendApiKey
      );

    try {
      const emailResult =
        await resend.emails.send({
          from: emailFrom,
          to: email,

          subject:
            "Verify your LogikBetPrediction account",

          html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
              <h2>Verify your email</h2>

              <p>
                Hi ${safeName},
              </p>

              <p>
                Please verify your LogikBetPrediction account before signing in.
              </p>

              <p style="margin:32px 0;">
                <a
                  href="${safeVerificationUrl}"
                  style="
                    background:#f59e0b;
                    color:#0f172a;
                    padding:12px 20px;
                    border-radius:8px;
                    text-decoration:none;
                    font-weight:700;
                  "
                >
                  Verify Email
                </a>
              </p>

              <p>
                This verification link expires in 30 minutes.
              </p>

              <p>
                If you did not request this email, you can ignore it.
              </p>
            </div>
          `,
        });

      if (emailResult.error) {
        console.error(
          "Verification email delivery failed:",
          emailResult.error.message
        );

        await prisma.verificationToken.deleteMany({
          where: {
            identifier:
              email,
            token:
              hashedVerificationToken,
          },
        });

        if (
          createdNewUser
        ) {
          await prisma.user.delete({
            where: {
              id: user.id,
            },
          });
        }

        return NextResponse.json(
          {
            error:
              "We could not send the verification email. Please try again.",
          },
          {
            status: 500,
          }
        );
      }
    } catch (emailError) {
      console.error(
        "Verification email error:",
        emailError
      );

      await prisma.verificationToken.deleteMany({
        where: {
          identifier:
            email,
        },
      });

      if (
        createdNewUser
      ) {
        await prisma.user.delete({
          where: {
            id: user.id,
          },
        });
      }

      return NextResponse.json(
        {
          error:
            "We could not send the verification email. Please try again.",
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json(
      {
        message:
          existingUser
            ? "A new verification email has been sent. Please check your inbox."
            : "Account created. Please check your email to verify your account.",

        user,
      },
      {
        status:
          existingUser
            ? 200
            : 201,
      }
    );
  } catch (error) {
    console.error(
      "Registration error:",
      error
    );

    if (
      error instanceof
        Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        {
          error:
            "An account with this email already exists.",
        },
        {
          status: 409,
        }
      );
    }

    return NextResponse.json(
      {
        error:
          "Something went wrong while creating your account.",
      },
      {
        status: 500,
      }
    );
  }
}
