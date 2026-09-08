import { prisma } from "@/lib/prisma";

type CreatePaymentNotificationParams = {
  userId: string;
  paymentId: string;
  subscriptionId: string;
  plan: "WEEKLY" | "MONTHLY";
  amount: number;
  expiresAt: Date;
};

type CreateSubscriptionNotificationParams = {
  userId: string;
  subscriptionId: string;
  plan: "WEEKLY" | "MONTHLY";
  status: "ACTIVE" | "PENDING";
  startsAt: Date | null;
  expiresAt: Date | null;
};

export async function createPaymentSuccessNotification({
  userId,
  paymentId,
  subscriptionId,
  plan,
  amount,
  expiresAt,
}: CreatePaymentNotificationParams) {
  const existingNotification =
    await prisma.notification.findFirst({
      where: {
        userId,
        type: "PAYMENT",
        message: {
          contains: paymentId,
        },
      },
    });

  if (existingNotification) {
    return {
      created: false,
      notification: existingNotification,
    };
  }

  const planName =
    plan === "MONTHLY"
      ? "Monthly VIP"
      : "Weekly VIP";

  const formattedAmount =
    (amount / 100).toLocaleString("en-NG");

  const formattedExpiry =
    new Intl.DateTimeFormat("en-NG", {
      dateStyle: "medium",
    }).format(expiresAt);

  const notification =
    await prisma.notification.create({
      data: {
        userId,
        type: "PAYMENT",
        channel: "IN_APP",
        title: "VIP payment successful",
        message:
          `Your ₦${formattedAmount} payment for ${planName} was successful. ` +
          `Your VIP subscription is active until ${formattedExpiry}. ` +
          `Payment ID: ${paymentId}. ` +
          `Subscription ID: ${subscriptionId}.`,
        sentAt: new Date(),
        readAt: null,
      },
    });

  return {
    created: true,
    notification,
  };
}

export async function createSubscriptionNotification({
  userId,
  subscriptionId,
  plan,
  status,
  startsAt,
  expiresAt,
}: CreateSubscriptionNotificationParams) {
  const existingNotification =
    await prisma.notification.findFirst({
      where: {
        userId,
        type: "SUBSCRIPTION",
        message: {
          contains: subscriptionId,
        },
      },
    });

  if (existingNotification) {
    return {
      created: false,
      notification: existingNotification,
    };
  }

  const planName =
    plan === "MONTHLY"
      ? "Monthly VIP"
      : "Weekly VIP";

  const formattedStart =
    startsAt
      ? new Intl.DateTimeFormat("en-NG", {
          dateStyle: "medium",
        }).format(startsAt)
      : null;

  const formattedExpiry =
    expiresAt
      ? new Intl.DateTimeFormat("en-NG", {
          dateStyle: "medium",
        }).format(expiresAt)
      : null;

  const isActive =
    status === "ACTIVE";

  const title = isActive
    ? "VIP subscription activated"
    : "VIP subscription scheduled";

  const message = isActive
    ? `Your ${planName} subscription is now active${
        formattedExpiry
          ? ` until ${formattedExpiry}`
          : ""
      }. Subscription ID: ${subscriptionId}.`
    : `Your ${planName} subscription has been added to your account and will begin${
        formattedStart
          ? ` on ${formattedStart}`
          : " after your current VIP plan ends"
      }${
        formattedExpiry
          ? `. It will expire on ${formattedExpiry}`
          : ""
      }. Subscription ID: ${subscriptionId}.`;

  const notification =
    await prisma.notification.create({
      data: {
        userId,
        type: "SUBSCRIPTION",
        channel: "IN_APP",
        title,
        message,
        sentAt: new Date(),
        readAt: null,
      },
    });

  return {
    created: true,
    notification,
  };
}
