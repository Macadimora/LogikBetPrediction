import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

function isValidInternationalPhoneNumber(
  phoneNumber: string
) {
  return /^\+[1-9]\d{7,14}$/.test(
    phoneNumber
  );
}

export async function GET() {
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

    let preferences =
      await prisma.notificationPreference.findUnique({
        where: {
          userId: session.user.id,
        },
      });

    if (!preferences) {
      preferences =
        await prisma.notificationPreference.create({
          data: {
            userId: session.user.id,
            emailEnabled: true,
            whatsappEnabled: false,
          },
        });
    }

    return NextResponse.json({
      success: true,
      preferences: {
        emailEnabled:
          preferences.emailEnabled,

        whatsappEnabled:
          preferences.whatsappEnabled,

        phoneNumber:
          preferences.phoneNumber || "",
      },
    });
  } catch (error) {
    console.error(
      "Notification preference GET error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Something went wrong while loading notification preferences.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function PATCH(
  request: Request
) {
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

    const emailEnabled =
      body.emailEnabled === true;

    const whatsappEnabled =
      body.whatsappEnabled === true;

    const phoneNumber =
      typeof body.phoneNumber === "string"
        ? body.phoneNumber
            .trim()
            .replace(/\s+/g, "")
        : "";

    if (
      whatsappEnabled &&
      !phoneNumber
    ) {
      return NextResponse.json(
        {
          error:
            "A phone number is required when WhatsApp notifications are enabled.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      phoneNumber &&
      !isValidInternationalPhoneNumber(
        phoneNumber
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Enter a valid international phone number, for example +2348012345678.",
        },
        {
          status: 400,
        }
      );
    }

    const preferences =
      await prisma.notificationPreference.upsert({
        where: {
          userId: session.user.id,
        },

        update: {
          emailEnabled,
          whatsappEnabled,
          phoneNumber:
            phoneNumber || null,
        },

        create: {
          userId: session.user.id,
          emailEnabled,
          whatsappEnabled,
          phoneNumber:
            phoneNumber || null,
        },
      });

    return NextResponse.json({
      success: true,
      message:
        "Notification preferences updated successfully.",

      preferences: {
        emailEnabled:
          preferences.emailEnabled,

        whatsappEnabled:
          preferences.whatsappEnabled,

        phoneNumber:
          preferences.phoneNumber || "",
      },
    });
  } catch (error) {
    console.error(
      "Notification preference PATCH error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Something went wrong while updating notification preferences.",
      },
      {
        status: 500,
      }
    );
  }
}
