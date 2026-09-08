import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";

import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const email =
      typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : "";

    const token =
      typeof body.token === "string"
        ? body.token.trim()
        : "";

    const password =
      typeof body.password === "string"
        ? body.password
        : "";

    const confirmPassword =
      typeof body.confirmPassword === "string"
        ? body.confirmPassword
        : "";

    if (
      !email ||
      !token ||
      !password ||
      !confirmPassword
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid password reset request.",
        },
        {
          status: 400,
        }
      );
    }

    if (password.length < 8) {
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

    if (password.length > 128) {
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

    if (
      password !==
      confirmPassword
    ) {
      return NextResponse.json(
        {
          error:
            "Password and confirmation do not match.",
        },
        {
          status: 400,
        }
      );
    }

    const tokenHash =
      crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

    const identifier =
      `password-reset:${email}`;

    const resetToken =
      await prisma.verificationToken.findUnique({
        where: {
          identifier_token: {
            identifier,
            token: tokenHash,
          },
        },
      });

    if (!resetToken) {
      return NextResponse.json(
        {
          error:
            "This password reset link is invalid or has already been used.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      resetToken.expires <=
      new Date()
    ) {
      await prisma.verificationToken.delete({
        where: {
          identifier_token: {
            identifier,
            token: tokenHash,
          },
        },
      });

      return NextResponse.json(
        {
          error:
            "This password reset link has expired. Please request a new one.",
        },
        {
          status: 400,
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
          passwordHash: true,
        },
      });

    if (!user) {
      return NextResponse.json(
        {
          error:
            "This password reset link is invalid.",
        },
        {
          status: 400,
        }
      );
    }

    if (user.passwordHash) {
      const sameAsOldPassword =
        await bcrypt.compare(
          password,
          user.passwordHash
        );

      if (sameAsOldPassword) {
        return NextResponse.json(
          {
            error:
              "Your new password must be different from your previous password.",
          },
          {
            status: 400,
          }
        );
      }
    }

    const passwordHash =
      await bcrypt.hash(
        password,
        12
      );

    await prisma.$transaction([
      prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          passwordHash,
          authVersion: {
            increment: 1,
          },
        },
      }),

      prisma.verificationToken.deleteMany({
        where: {
          identifier,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message:
        "Your password has been reset successfully. Please sign in again with your new password.",
    });
  } catch (error) {
    console.error(
      "Reset password error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Something went wrong while resetting your password.",
      },
      {
        status: 500,
      }
    );
  }
}