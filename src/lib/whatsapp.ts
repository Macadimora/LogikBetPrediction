import { prisma } from "@/lib/prisma";
import {
  decryptSecret,
  isEncryptedSecret,
} from "@/lib/encryption";

type SendWhatsAppTemplateParams = {
  phoneNumber: string;
  templateName?: string;
  languageCode?: string;
  bodyParameters?: string[];
};

function normalizePhoneNumber(
  phoneNumber: string
) {
  return phoneNumber
    .replace(/\s+/g, "")
    .replace(/^\+/, "");
}

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

export async function sendWhatsAppTemplate({
  phoneNumber,
  templateName,
  languageCode = "en",
  bodyParameters = [],
}: SendWhatsAppTemplateParams) {
  const integration =
    await prisma.whatsAppIntegration.findFirst({
      orderBy: {
        createdAt: "asc",
      },
    });

  if (
    !integration ||
    !integration.enabled
  ) {
    return {
      success: false,
      skipped: true,
      messageId: null,
      reason:
        "WhatsApp integration is disabled.",
    };
  }

  const storedAccessToken =
    integration.accessToken;

  const phoneNumberId =
    integration.phoneNumberId;

  const apiVersion =
    integration.apiVersion ||
    "v23.0";

  const resolvedTemplateName =
    templateName ||
    integration.predictionTemplateName;

  if (
    !storedAccessToken ||
    !phoneNumberId ||
    !resolvedTemplateName
  ) {
    console.error(
      "WhatsApp notification skipped: integration is incomplete."
    );

    return {
      success: false,
      skipped: true,
      messageId: null,
      reason:
        "WhatsApp integration is incomplete.",
    };
  }

  let accessToken: string;

  try {
    accessToken =
      resolveAccessToken(
        storedAccessToken
      );
  } catch (error) {
    console.error(
      "WhatsApp access token decryption failed:",
      error
    );

    return {
      success: false,
      skipped: true,
      messageId: null,
      reason:
        "WhatsApp credentials could not be decrypted.",
    };
  }

  const normalizedPhone =
    normalizePhoneNumber(
      phoneNumber
    );

  if (!normalizedPhone) {
    return {
      success: false,
      skipped: true,
      messageId: null,
      reason:
        "Invalid phone number.",
    };
  }

  const components =
    bodyParameters.length > 0
      ? [
          {
            type: "body",
            parameters:
              bodyParameters.map(
                (value) => ({
                  type: "text",
                  text: value,
                })
              ),
          },
        ]
      : [];

  try {
    const response =
      await fetch(
        `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`,
        {
          method: "POST",

          headers: {
            Authorization:
              `Bearer ${accessToken}`,

            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            messaging_product:
              "whatsapp",

            to:
              normalizedPhone,

            type:
              "template",

            template: {
              name:
                resolvedTemplateName,

              language: {
                code:
                  languageCode,
              },

              components,
            },
          }),
        }
      );

    const data =
      await response.json();

    if (!response.ok) {
      console.error(
        "WhatsApp API error:",
        data
      );

      return {
        success: false,
        skipped: false,
        messageId: null,
        error: data,
      };
    }

    const messageId =
      data?.messages?.[0]?.id ??
      null;

    return {
      success: true,
      skipped: false,
      messageId,
    };
  } catch (error) {
    console.error(
      "WhatsApp request failed:",
      error
    );

    return {
      success: false,
      skipped: false,
      messageId: null,
      error,
    };
  }
}