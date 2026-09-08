import { Resend } from "resend";

import { prisma } from "@/lib/prisma";
import { sendWhatsAppTemplate } from "@/lib/whatsapp";
import { expireOldSubscriptions } from "@/lib/subscriptions";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function sendPredictionPublishedNotifications(
  predictionId: string
) {
  const prediction =
    await prisma.prediction.findUnique({
      where: {
        id: predictionId,
      },

      include: {
        fixture: true,
      },
    });

  if (
    !prediction ||
    prediction.status !== "PUBLISHED"
  ) {
    return {
      inAppCreated: 0,
      emailSent: 0,
      emailFailed: 0,
      whatsappSent: 0,
      whatsappFailed: 0,
      skipped: true,
    };
  }

  /*
   * Keep subscription states current before
   * deciding who is eligible for VIP alerts.
   */
  await expireOldSubscriptions();

  const now = new Date();

  /*
   * FREE predictions:
   * All registered users are eligible.
   *
   * VIP predictions:
   * Only users with a currently valid
   * ACTIVE subscription are eligible.
   */
  const users =
    await prisma.user.findMany({
      where:
        prediction.access === "VIP"
          ? {
              subscriptions: {
                some: {
                  status: "ACTIVE",

                  OR: [
                    {
                      expiresAt: null,
                    },
                    {
                      expiresAt: {
                        gt: now,
                      },
                    },
                  ],
                },
              },
            }
          : undefined,

      select: {
        id: true,
        name: true,
        email: true,

        notificationPrefs: {
          select: {
            emailEnabled: true,
            whatsappEnabled: true,
            phoneNumber: true,
          },
        },
      },
    });

  if (users.length === 0) {
    return {
      inAppCreated: 0,
      emailSent: 0,
      emailFailed: 0,
      whatsappSent: 0,
      whatsappFailed: 0,
      skipped: false,
    };
  }

  const fixture =
    prediction.fixture;

  const matchName =
    `${fixture.homeTeam} vs ${fixture.awayTeam}`;

  const predictionLabel =
    prediction.access === "VIP"
      ? "VIP Prediction"
      : "Free Prediction";

  const subject =
    `${predictionLabel}: ${matchName}`;

  let inAppCreated = 0;
  let emailSent = 0;
  let emailFailed = 0;
  let whatsappSent = 0;
  let whatsappFailed = 0;

  /*
   * --------------------------------------------
   * IN-APP NOTIFICATIONS
   * --------------------------------------------
   */

  for (const user of users) {
    try {
      const existingNotification =
        await prisma.notification.findFirst({
          where: {
            userId: user.id,

            type:
              "NEW_PREDICTION",

            channel:
              "IN_APP",

            message: {
              contains:
                prediction.id,
            },
          },
        });

      if (existingNotification) {
        continue;
      }

      await prisma.notification.create({
        data: {
          userId:
            user.id,

          type:
            "NEW_PREDICTION",

          channel:
            "IN_APP",

          title:
            subject,

          message:
            `A new ${predictionLabel.toLowerCase()} was published for ${matchName}. ` +
            `Prediction ID: ${prediction.id}.`,

          sentAt:
            new Date(),

          readAt:
            null,
        },
      });

      inAppCreated++;
    } catch (error) {
      console.error(
        `In-app prediction notification failed for user ${user.id}:`,
        error
      );
    }
  }

  /*
   * --------------------------------------------
   * EMAIL NOTIFICATIONS
   * --------------------------------------------
   */

  const resendApiKey =
    process.env.RESEND_API_KEY;

  const emailFrom =
    process.env.RESET_EMAIL_FROM;

  if (
    resendApiKey &&
    emailFrom
  ) {
    const resend =
      new Resend(resendApiKey);

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000";

    const dashboardUrl =
      `${appUrl}/dashboard`;

    for (const user of users) {
      if (!user.email) {
        continue;
      }

      const emailEnabled =
        user.notificationPrefs
          ?.emailEnabled ?? true;

      if (!emailEnabled) {
        continue;
      }

      try {
        const displayName =
          user.name?.trim() ||
          "Football fan";

        const html = `
          <div
            style="
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #111827;
            "
          >
            <h2>
              New ${escapeHtml(
                predictionLabel
              )} Available
            </h2>

            <p>
              Hi ${escapeHtml(
                displayName
              )},
            </p>

            <p>
              A new football prediction
              has just been published on
              LogikBetPrediction.
            </p>

            <p>
              <strong>
                ${escapeHtml(
                  matchName
                )}
              </strong>
            </p>

            ${
              prediction.title
                ? `
                  <p>
                    ${escapeHtml(
                      prediction.title
                    )}
                  </p>
                `
                : ""
            }

            <p>
              Kickoff:
              <strong>
                ${escapeHtml(
                  fixture.kickoffTime.toUTCString()
                )}
              </strong>
            </p>

            <p>
              <a
                href="${dashboardUrl}"
                style="
                  display: inline-block;
                  padding: 12px 18px;
                  background: #f59e0b;
                  color: #111827;
                  text-decoration: none;
                  border-radius: 8px;
                  font-weight: bold;
                "
              >
                View Prediction
              </a>
            </p>
          </div>
        `;

        const {
          error,
        } = await resend.emails.send(
          {
            from:
              emailFrom,

            to:
              user.email,

            subject,

            html,
          },
          {
            idempotencyKey:
              `prediction-${prediction.id}-user-${user.id}`,
          }
        );

        if (error) {
          console.error(
            `Prediction email failed for ${user.email}:`,
            error
          );

          emailFailed++;
          continue;
        }

        emailSent++;
      } catch (error) {
        console.error(
          `Prediction email error for user ${user.id}:`,
          error
        );

        emailFailed++;
      }
    }
  } else {
    console.error(
      "Prediction email notifications skipped: Resend is not configured."
    );
  }

  /*
   * --------------------------------------------
   * WHATSAPP NOTIFICATIONS
   * --------------------------------------------
   */

  for (const user of users) {
    const whatsappEnabled =
      user.notificationPrefs
        ?.whatsappEnabled ?? false;

    const phoneNumber =
      user.notificationPrefs
        ?.phoneNumber;

    if (
      !whatsappEnabled ||
      !phoneNumber
    ) {
      continue;
    }

    try {
      const result =
        await sendWhatsAppTemplate({
          phoneNumber,

          bodyParameters: [
            predictionLabel,
            matchName,
            fixture.kickoffTime.toUTCString(),
          ],
        });

      if (!result.success) {
        if (!result.skipped) {
          whatsappFailed++;
        }

        continue;
      }

      const existingWhatsAppNotification =
        await prisma.notification.findFirst({
          where: {
            userId:
              user.id,

            type:
              "NEW_PREDICTION",

            channel:
              "WHATSAPP",

            message: {
              contains:
                prediction.id,
            },
          },
        });

      if (!existingWhatsAppNotification) {
        await prisma.notification.create({
          data: {
            userId:
              user.id,

            type:
              "NEW_PREDICTION",

            channel:
              "WHATSAPP",

            title:
              subject,

            message:
              `WhatsApp notification sent for ${matchName}. ` +
              `Prediction ID: ${prediction.id}.`,

            sentAt:
              new Date(),

            readAt:
              null,
          },
        });
      }

      whatsappSent++;
    } catch (error) {
      console.error(
        `WhatsApp prediction notification failed for user ${user.id}:`,
        error
      );

      whatsappFailed++;
    }
  }

  return {
    inAppCreated,
    emailSent,
    emailFailed,
    whatsappSent,
    whatsappFailed,
    skipped: false,
  };
}
