import { NextResponse } from "next/server";
import crypto from "crypto";
import { Resend } from "resend";

import { prisma } from "@/lib/prisma";
import { rateLimitForgotPassword } from "@/lib/rate-limit";

function getForgotPasswordIdentifier(
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

function escapeHtml(
  value: string
) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function POST(
  request: Request
) {
  try {
    const body =
      await request.json();

    const email =
      typeof body.email === "string"
        ? body.email
            .trim()
            .toLowerCase()
        : "";

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

    const rateLimitIdentifier =
      getForgotPasswordIdentifier(
        request,
        email
      );

    const rateLimit =
      await rateLimitForgotPassword(
        rateLimitIdentifier
      );

    if (!rateLimit.success) {
      const retryAfterSeconds =
        Math.max(
          1,
          Math.ceil(
            (rateLimit.reset -
              Date.now()) /
              1000
          )
        );

      return NextResponse.json(
        {
          error:
            "Too many password reset requests. Please wait before trying again.",
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

    const genericMessage =
      "If an account exists for that email, password reset instructions have been sent.";

    const genericResponse = () =>
      NextResponse.json(
        {
          success: true,
          message:
            genericMessage,
        },
        {
          headers: {
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

    const user =
      await prisma.user.findUnique({
        where: {
          email,
        },

        select: {
          email: true,
          name: true,
        },
      });

    if (!user?.email) {
      return genericResponse();
    }

    const resendApiKey =
      process.env.RESEND_API_KEY;

    if (!resendApiKey) {
      console.error(
        "RESEND_API_KEY is not configured."
      );

      return genericResponse();
    }

    const identifier =
      `password-reset:${user.email}`;

    await prisma.verificationToken.deleteMany({
      where: {
        identifier,
      },
    });

    const rawToken =
      crypto
        .randomBytes(32)
        .toString("hex");

    const tokenHash =
      crypto
        .createHash("sha256")
        .update(rawToken)
        .digest("hex");

    const expires =
      new Date(
        Date.now() +
          30 * 60 * 1000
      );

    await prisma.verificationToken.create({
      data: {
        identifier,
        token: tokenHash,
        expires,
      },
    });

    const appUrl =
      process.env
        .NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000";

    const resetUrl =
      `${appUrl}/reset-password?token=${rawToken}&email=${encodeURIComponent(
        user.email
      )}`;

    const fromEmail =
      process.env
        .RESET_EMAIL_FROM ||
      "LogikBetPrediction <onboarding@resend.dev>";

    const recipientName =
      user.name?.trim() ||
      "there";

    const resend =
      new Resend(
        resendApiKey
      );

    const { error: emailError } =
      await resend.emails.send({
        from:
          fromEmail,

        to:
          user.email,

        subject:
          "Reset your LogikBetPrediction password",

        html: `
          <div
            style="
              font-family: Arial, sans-serif;
              max-width: 600px;
              margin: 0 auto;
              padding: 32px;
              color: #0f172a;
            "
          >
            <h1
              style="
                font-size: 26px;
                margin-bottom: 20px;
              "
            >
              Reset your password
            </h1>

            <p>
              Hi ${escapeHtml(
                recipientName
              )},
            </p>

            <p>
              We received a request to reset your
              LogikBetPrediction password.
            </p>

            <p
              style="
                margin-top: 28px;
                margin-bottom: 28px;
              "
            >
              <a
                href="${escapeHtml(
                  resetUrl
                )}"
                style="
                  background: #f59e0b;
                  color: #0f172a;
                  padding: 14px 22px;
                  border-radius: 8px;
                  text-decoration: none;
                  font-weight: 700;
                  display: inline-block;
                "
              >
                Reset Password
              </a>
            </p>

            <p>
              This link will expire in 30 minutes
              and can only be used once.
            </p>

            <p>
              If you did not request a password
              reset, you can safely ignore this
              email.
            </p>

            <hr
              style="
                margin: 30px 0;
                border: 0;
                border-top: 1px solid #e2e8f0;
              "
            />

            <p
              style="
                font-size: 13px;
                color: #64748b;
              "
            >
              LogikBetPrediction
            </p>
          </div>
        `,
      });

    if (emailError) {
      console.error(
        "Password reset email error:",
        emailError
      );

      await prisma.verificationToken.deleteMany({
        where: {
          identifier,
          token: tokenHash,
        },
      });

      return genericResponse();
    }

    return genericResponse();
  } catch (error) {
    console.error(
      "Forgot password error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Something went wrong while processing the password reset request.",
      },
      {
        status: 500,
      }
    );
  }
}