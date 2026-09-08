import {
  NextResponse,
} from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  decryptSecret,
  isEncryptedSecret,
} from "@/lib/encryption";

function resolveAccessToken(
  storedToken: string
) {
  if (
    !isEncryptedSecret(
      storedToken
    )
  ) {
    throw new Error(
      "Stored WhatsApp access token is not encrypted."
    );
  }

  return decryptSecret(
    storedToken
  );
}

export async function POST() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    if (
      session.user.role !==
      "ADMIN"
    ) {
      return NextResponse.json(
        {
          error: "Forbidden",
        },
        {
          status: 403,
        }
      );
    }

    const integration =
      await prisma.whatsAppIntegration.findFirst({
        orderBy: {
          createdAt: "asc",
        },
      });

    if (!integration) {
      return NextResponse.json(
        {
          error:
            "WhatsApp integration has not been configured.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !integration.accessToken ||
      !integration.phoneNumberId
    ) {
      return NextResponse.json(
        {
          error:
            "Access Token and Phone Number ID are required.",
        },
        {
          status: 400,
        }
      );
    }

    let accessToken: string;

    try {
      accessToken =
        resolveAccessToken(
          integration.accessToken
        );
    } catch (error) {
      console.error(
        "WhatsApp access token decryption failed:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "The saved WhatsApp access token could not be decrypted.",
        },
        {
          status: 500,
        }
      );
    }

    const apiVersion =
      integration.apiVersion ||
      "v23.0";

    const response =
      await fetch(
        `https://graph.facebook.com/${apiVersion}/${integration.phoneNumberId}?fields=display_phone_number,verified_name`,
        {
          method: "GET",

          headers: {
            Authorization:
              `Bearer ${accessToken}`,
          },

          cache: "no-store",
        }
      );

    const data =
      await response.json();

    if (!response.ok) {
      console.error(
        "WhatsApp connection test failed:",
        data
      );

      return NextResponse.json(
        {
          success: false,

          error:
            data?.error?.message ||
            "Meta rejected the WhatsApp credentials.",
        },
        {
          status: 400,
        }
      );
    }

    return NextResponse.json({
      success: true,

      message:
        "WhatsApp connection is valid.",

      account: {
        displayPhoneNumber:
          data.display_phone_number ??
          null,

        verifiedName:
          data.verified_name ??
          null,
      },
    });
  } catch (error) {
    console.error(
      "WhatsApp connection test error:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          "Failed to test WhatsApp connection.",
      },
      {
        status: 500,
      }
    );
  }
}