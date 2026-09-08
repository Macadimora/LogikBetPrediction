import {
  NextRequest,
  NextResponse,
} from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { encryptSecret } from "@/lib/encryption";

function isValidPhoneNumberId(
  value: string
) {
  return /^\d{5,30}$/.test(value);
}

function isValidApiVersion(
  value: string
) {
  return /^v\d+\.\d+$/.test(value);
}

function isValidTemplateName(
  value: string
) {
  return /^[a-z0-9_]{1,100}$/.test(
    value
  );
}

export async function PATCH(
  request: NextRequest
) {
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

    const body =
      await request.json();

    if (
      typeof body.enabled !==
      "boolean"
    ) {
      return NextResponse.json(
        {
          error:
            "Enabled must be either true or false.",
        },
        {
          status: 400,
        }
      );
    }

    const enabled =
      body.enabled;

    const phoneNumberId =
      typeof body.phoneNumberId ===
      "string"
        ? body.phoneNumberId.trim()
        : "";

    const apiVersion =
      typeof body.apiVersion ===
      "string"
        ? body.apiVersion.trim()
        : "";

    const predictionTemplateName =
      typeof body.predictionTemplateName ===
      "string"
        ? body.predictionTemplateName.trim()
        : "";

    const accessToken =
      typeof body.accessToken ===
        "string" &&
      body.accessToken.trim()
        ? body.accessToken.trim()
        : undefined;

    if (
      phoneNumberId &&
      !isValidPhoneNumberId(
        phoneNumberId
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Phone Number ID must contain only digits.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      apiVersion &&
      !isValidApiVersion(
        apiVersion
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Graph API version must use a format such as v23.0.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      predictionTemplateName &&
      !isValidTemplateName(
        predictionTemplateName
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Template name may contain only lowercase letters, numbers, and underscores.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      accessToken &&
      accessToken.length > 4096
    ) {
      return NextResponse.json(
        {
          error:
            "Access Token is too long.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      enabled &&
      !phoneNumberId
    ) {
      return NextResponse.json(
        {
          error:
            "Phone Number ID is required before enabling WhatsApp.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      enabled &&
      !apiVersion
    ) {
      return NextResponse.json(
        {
          error:
            "Graph API version is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      enabled &&
      !predictionTemplateName
    ) {
      return NextResponse.json(
        {
          error:
            "Prediction template name is required.",
        },
        {
          status: 400,
        }
      );
    }

    const existingIntegration =
      await prisma.whatsAppIntegration.findFirst({
        orderBy: {
          createdAt: "asc",
        },
      });

    if (
      enabled &&
      !accessToken &&
      !existingIntegration?.accessToken
    ) {
      return NextResponse.json(
        {
          error:
            "Access Token is required before enabling WhatsApp.",
        },
        {
          status: 400,
        }
      );
    }

    const encryptedAccessToken =
      accessToken
        ? encryptSecret(
            accessToken
          )
        : undefined;

    let integration;

    if (existingIntegration) {
      integration =
        await prisma.whatsAppIntegration.update({
          where: {
            id: existingIntegration.id,
          },

          data: {
            enabled,
            provider: "META",

            phoneNumberId:
              phoneNumberId ||
              null,

            apiVersion:
              apiVersion ||
              "v23.0",

            predictionTemplateName:
              predictionTemplateName ||
              "new_prediction",

            ...(encryptedAccessToken
              ? {
                  accessToken:
                    encryptedAccessToken,
                }
              : {}),
          },
        });
    } else {
      integration =
        await prisma.whatsAppIntegration.create({
          data: {
            enabled,
            provider: "META",

            phoneNumberId:
              phoneNumberId ||
              null,

            apiVersion:
              apiVersion ||
              "v23.0",

            predictionTemplateName:
              predictionTemplateName ||
              "new_prediction",

            accessToken:
              encryptedAccessToken ||
              null,
          },
        });
    }

    return NextResponse.json({
      success: true,

      integration: {
        enabled:
          integration.enabled,

        provider:
          integration.provider,

        phoneNumberId:
          integration.phoneNumberId,

        apiVersion:
          integration.apiVersion,

        predictionTemplateName:
          integration.predictionTemplateName,

        hasAccessToken:
          Boolean(
            integration.accessToken
          ),
      },
    });
  } catch (error) {
    console.error(
      "WhatsApp integration save error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to save WhatsApp integration.",
      },
      {
        status: 500,
      }
    );
  }
}