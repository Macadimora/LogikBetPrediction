import crypto from "crypto";

import { NextResponse } from "next/server";
import { Resend } from "resend";

import { prisma } from "@/lib/prisma";
import { rateLimitResendVerification } from "@/lib/rate-limit";

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

const GENERIC_RESPONSE = {
  message:
    "If an unverified account exists for that email, a new verification link has been sent.",
};

export async function POST(
  request: Request
) {
  try {
    const body =
      await request.json();

    const email =
      String(
        body.email ?? ""
      )
        .trim()
        .toLowerCase();

    if (!email) {
      return NextResponse.json(
        {
          error:
            "Email is required.",
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

    const identifier =
      getClientIdentifier(
        request,
        email
      );

    const rateLimit =
      await rateLimitResendVerification(
        identifier
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
            "Too many verification email requests. Please try again later.",
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

    const user =
      await prisma.user.findUnique({
        where: {
          email,
        },

        select: {
          id: true,
          name: true,
          email: true,
          emailVerified: true,
        },
      });

    if (
      !user ||
      !user.email ||
      user.emailVerified
    ) {
      return NextResponse.json(
        GENERIC_RESPONSE,
        {
          status: 200,
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
        "Resend verification configuration is missing."
      );

      return NextResponse.json(
        GENERIC_RESPONSE,
        {
          status: 200,
        }
      );
    }

    const rawToken =
      crypto
        .randomBytes(32)
        .toString("hex");

    const hashedToken =
      crypto
        .createHash(
          "sha256"
        )
        .update(rawToken)
        .digest("hex");

    const expires =
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
        rawToken
      )}` +
      `&email=${encodeURIComponent(
        email
      )}`;

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
              hashedToken,
            expires,
          },
        });
      }
    );

    const resend =
      new Resend(
        resendApiKey
      );

    const safeName =
      escapeHtml(
        user.name || "there"
      );

    const safeVerificationUrl =
      escapeHtml(
        verificationUrl
      );

    try {
      const emailResult =
        await resend.emails.send({
          from: emailFrom,
          to: user.email,

          subject:
            "Verify your LogikBetPrediction account",

          html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
              <h2>Verify your email</h2>

              <p>
                Hi ${safeName},
              </p>

              <p>
                Here is your new LogikBetPrediction verification link.
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
                This link expires in 30 minutes.
              </p>

              <p>
                If you did not request this email, you can ignore it.
              </p>
            </div>
          `,
        });

      if (emailResult.error) {
        console.error(
          "Resend verification email delivery failed:",
          emailResult.error.message
        );

        await prisma.verificationToken.deleteMany({
          where: {
            identifier:
              email,
            token:
              hashedToken,
          },
        });

        return NextResponse.json(
          GENERIC_RESPONSE,
          {
            status: 200,
          }
        );
      }
    } catch (emailError) {
      console.error(
        "Resend verification email error:",
        emailError
      );

      await prisma.verificationToken.deleteMany({
        where: {
          identifier:
            email,
          token:
            hashedToken,
        },
      });

      return NextResponse.json(
        GENERIC_RESPONSE,
        {
          status: 200,
        }
      );
    }

    return NextResponse.json(
      GENERIC_RESPONSE,
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Resend verification error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to process verification request.",
      },
      {
        status: 500,
      }
    );
  }
}
