import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    const body = await request.json();

    const currentPassword =
      typeof body.currentPassword === "string"
        ? body.currentPassword
        : "";

    const newPassword =
      typeof body.newPassword === "string"
        ? body.newPassword
        : "";

    const confirmPassword =
      typeof body.confirmPassword === "string"
        ? body.confirmPassword
        : "";

    if (
      !currentPassword ||
      !newPassword ||
      !confirmPassword
    ) {
      return NextResponse.json(
        {
          error: "All password fields are required.",
        },
        {
          status: 400,
        }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        {
          error:
            "New password must be at least 8 characters.",
        },
        {
          status: 400,
        }
      );
    }

    if (newPassword.length > 128) {
      return NextResponse.json(
        {
          error:
            "New password must not exceed 128 characters.",
        },
        {
          status: 400,
        }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        {
          error:
            "New password and confirmation do not match.",
        },
        {
          status: 400,
        }
      );
    }

    if (currentPassword === newPassword) {
      return NextResponse.json(
        {
          error:
            "Your new password must be different from your current password.",
        },
        {
          status: 400,
        }
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
      select: {
        id: true,
        passwordHash: true,
      },
    });

    if (!user || !user.passwordHash) {
      return NextResponse.json(
        {
          error:
            "Unable to change password for this account.",
        },
        {
          status: 400,
        }
      );
    }

    const passwordMatches =
      await bcrypt.compare(
        currentPassword,
        user.passwordHash
      );

    if (!passwordMatches) {
      return NextResponse.json(
        {
          error: "Current password is incorrect.",
        },
        {
          status: 400,
        }
      );
    }

    const sameAsCurrentPassword =
      await bcrypt.compare(
        newPassword,
        user.passwordHash
      );

    if (sameAsCurrentPassword) {
      return NextResponse.json(
        {
          error:
            "Your new password must be different from your current password.",
        },
        {
          status: 400,
        }
      );
    }

    const newPasswordHash =
      await bcrypt.hash(
        newPassword,
        12
      );

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        passwordHash:
          newPasswordHash,

        authVersion: {
          increment: 1,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message:
        "Password changed successfully. Please sign in again.",
    });
  } catch (error) {
    console.error(
      "Password change error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Something went wrong while changing your password.",
      },
      {
        status: 500,
      }
    );
  }
}