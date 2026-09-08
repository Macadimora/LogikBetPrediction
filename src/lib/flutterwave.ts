import { prisma } from "@/lib/prisma";

import {
  SUBSCRIPTION_PLANS,
  SubscriptionPlanKey,
} from "@/lib/subscription-plans";

import {
  createPaymentSuccessNotification,
  createSubscriptionNotification,
} from "@/lib/payment-notifications";

type ActivateFlutterwavePaymentResult = {
  success: boolean;
  alreadyProcessed?: boolean;
  error?: string;
};

export async function verifyAndActivateFlutterwavePayment(
  transactionId: string,
  txRef: string
): Promise<ActivateFlutterwavePaymentResult> {
  if (!process.env.FLW_SECRET_KEY) {
    return {
      success: false,
      error: "Flutterwave is not configured.",
    };
  }

  const payment =
    await prisma.payment.findUnique({
      where: {
        reference: txRef,
      },
    });

  if (
    !payment ||
    payment.provider !== "FLUTTERWAVE"
  ) {
    return {
      success: false,
      error: "Payment not found.",
    };
  }

  if (
    payment.status === "SUCCESS" &&
    payment.subscriptionId
  ) {
    return {
      success: true,
      alreadyProcessed: true,
    };
  }

  const verificationResponse =
    await fetch(
      `https://api.flutterwave.com/v3/transactions/${transactionId}/verify`,
      {
        method: "GET",

        headers: {
          Authorization:
            `Bearer ${process.env.FLW_SECRET_KEY}`,

          "Content-Type":
            "application/json",
        },

        cache: "no-store",
      }
    );

  const verification =
    await verificationResponse.json();

  if (
    !verificationResponse.ok ||
    !verification.data
  ) {
    return {
      success: false,
      error:
        "Unable to verify Flutterwave transaction.",
    };
  }

  const transaction =
    verification.data;

  const metadata =
    payment.metadata as {
      plan?: SubscriptionPlanKey;
    } | null;

  const plan =
    metadata?.plan;

  if (
    !plan ||
    !SUBSCRIPTION_PLANS[plan]
  ) {
    return {
      success: false,
      error:
        "Invalid subscription plan.",
    };
  }

  const selectedPlan =
    SUBSCRIPTION_PLANS[plan];

  const expectedAmount =
    payment.amount / 100;

  const transactionAmount =
    Number(transaction.amount);

  const paymentIsValid =
    transaction.status ===
      "successful" &&
    transaction.tx_ref ===
      payment.reference &&
    transaction.currency ===
      payment.currency &&
    Number.isFinite(
      transactionAmount
    ) &&
    transactionAmount ===
      expectedAmount;

  if (!paymentIsValid) {
    if (
      payment.status ===
      "PENDING"
    ) {
      await prisma.payment.update({
        where: {
          id: payment.id,
        },

        data: {
          status: "FAILED",
        },
      });
    }

    return {
      success: false,

      error:
        "Flutterwave transaction details do not match.",
    };
  }

  const result =
    await prisma.$transaction(
      async (tx) => {
        const currentPayment =
          await tx.payment.findUnique({
            where: {
              id: payment.id,
            },
          });

        if (!currentPayment) {
          return {
            success:
              false as const,

            error:
              "Payment no longer exists.",
          };
        }

        if (
          currentPayment.status ===
            "SUCCESS" &&
          currentPayment.subscriptionId
        ) {
          return {
            success:
              true as const,

            alreadyProcessed:
              true as const,
          };
        }

        if (
          currentPayment.status !==
          "PENDING"
        ) {
          return {
            success:
              false as const,

            error:
              "Payment is no longer eligible for processing.",
          };
        }

        const claimedPayment =
          await tx.payment.updateMany({
            where: {
              id:
                currentPayment.id,

              status:
                "PENDING",

              subscriptionId:
                null,
            },

            data: {
              status:
                "SUCCESS",

              paidAt:
                new Date(),
            },
          });

        if (
          claimedPayment.count ===
          0
        ) {
          const latestPayment =
            await tx.payment.findUnique({
              where: {
                id:
                  currentPayment.id,
              },
            });

          if (
            latestPayment?.status ===
              "SUCCESS" &&
            latestPayment.subscriptionId
          ) {
            return {
              success:
                true as const,

              alreadyProcessed:
                true as const,
            };
          }

          return {
            success:
              false as const,

            error:
              "Payment is already being processed.",
          };
        }

        const now =
          new Date();

        const existingActiveSubscription =
          await tx.subscription.findFirst({
            where: {
              userId:
                currentPayment.userId,

              status:
                "ACTIVE",

              expiresAt: {
                gt: now,
              },
            },

            orderBy: {
              expiresAt:
                "desc",
            },
          });

        const latestPendingSubscription =
          await tx.subscription.findFirst({
            where: {
              userId:
                currentPayment.userId,

              status:
                "PENDING",

              expiresAt: {
                gt: now,
              },
            },

            orderBy: {
              expiresAt:
                "desc",
            },
          });

        const latestExpiry =
          latestPendingSubscription
            ?.expiresAt ??
          existingActiveSubscription
            ?.expiresAt ??
          now;

        const startsAt =
          new Date(
            latestExpiry
          );

        const expiresAt =
          new Date(
            startsAt
          );

        expiresAt.setDate(
          expiresAt.getDate() +
            selectedPlan.durationDays
        );

        const subscriptionStatus:
          | "ACTIVE"
          | "PENDING" =
          startsAt.getTime() >
          now.getTime()
            ? "PENDING"
            : "ACTIVE";

        const subscription =
          await tx.subscription.create({
            data: {
              userId:
                currentPayment.userId,

              plan,

              status:
                subscriptionStatus,

              startsAt,

              expiresAt,

              provider:
                "FLUTTERWAVE",

              providerSubscriptionId:
                String(
                  transaction.id
                ),
            },
          });

        await tx.payment.update({
          where: {
            id:
              currentPayment.id,
          },

          data: {
            subscriptionId:
              subscription.id,
          },
        });

        return {
          success:
            true as const,

          alreadyProcessed:
            false as const,

          paymentId:
            currentPayment.id,

          userId:
            currentPayment.userId,

          subscriptionId:
            subscription.id,

          plan,

          amount:
            currentPayment.amount,

          subscriptionStatus,

          startsAt,

          expiresAt,
        };
      }
    );

  if (!result.success) {
    return {
      success: false,
      error: result.error,
    };
  }

  if (
    result.alreadyProcessed
  ) {
    return {
      success: true,
      alreadyProcessed: true,
    };
  }

  try {
    await createPaymentSuccessNotification({
      userId:
        result.userId,

      paymentId:
        result.paymentId,

      subscriptionId:
        result.subscriptionId,

      plan:
        result.plan,

      amount:
        result.amount,

      expiresAt:
        result.expiresAt,
    });
  } catch (error) {
    console.error(
      "Payment notification error:",
      error
    );
  }

  try {
    await createSubscriptionNotification({
      userId:
        result.userId,

      subscriptionId:
        result.subscriptionId,

      plan:
        result.plan,

      status:
        result.subscriptionStatus,

      startsAt:
        result.startsAt,

      expiresAt:
        result.expiresAt,
    });
  } catch (error) {
    console.error(
      "Subscription notification error:",
      error
    );
  }

  return {
    success: true,
    alreadyProcessed: false,
  };
}