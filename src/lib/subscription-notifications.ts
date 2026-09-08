import { prisma } from "@/lib/prisma";

type CreateSubscriptionExpiredNotificationParams = {
  userId: string;
  subscriptionId: string;
  plan: "WEEKLY" | "MONTHLY";
  expiresAt: Date | null;
};

type CreateSubscriptionActivatedNotificationParams = {
  userId: string;
  subscriptionId: string;
  plan: "WEEKLY" | "MONTHLY";
  startsAt: Date | null;
  expiresAt: Date | null;
};

export async function createSubscriptionExpiredNotification({
  userId,
  subscriptionId,
  plan,
  expiresAt,
}: CreateSubscriptionExpiredNotificationParams) {
  const existingNotification =
    await prisma.notification.findFirst({
      where: {
        userId,
        type: "SUBSCRIPTION",
        title: "VIP subscription expired",
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

  const formattedExpiry = expiresAt
    ? new Intl.DateTimeFormat("en-NG", {
        dateStyle: "medium",
      }).format(expiresAt)
    : null;

  const notification =
    await prisma.notification.create({
      data: {
        userId,
        type: "SUBSCRIPTION",
        channel: "IN_APP",
        title: "VIP subscription expired",
        message:
          `Your ${planName} subscription has expired` +
          `${formattedExpiry ? ` on ${formattedExpiry}` : ""}. ` +
          `You no longer have access to VIP predictions. ` +
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

export async function createSubscriptionActivatedNotification({
  userId,
  subscriptionId,
  plan,
  startsAt,
  expiresAt,
}: CreateSubscriptionActivatedNotificationParams) {
  const existingNotification =
    await prisma.notification.findFirst({
      where: {
        userId,
        type: "SUBSCRIPTION",
        title: "VIP subscription activated",
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

  const formattedStart = startsAt
    ? new Intl.DateTimeFormat("en-NG", {
        dateStyle: "medium",
      }).format(startsAt)
    : null;

  const formattedExpiry = expiresAt
    ? new Intl.DateTimeFormat("en-NG", {
        dateStyle: "medium",
      }).format(expiresAt)
    : null;

  const notification =
    await prisma.notification.create({
      data: {
        userId,
        type: "SUBSCRIPTION",
        channel: "IN_APP",
        title: "VIP subscription activated",
        message:
          `Your ${planName} subscription is now active` +
          `${formattedStart ? ` from ${formattedStart}` : ""}` +
          `${formattedExpiry ? ` until ${formattedExpiry}` : ""}. ` +
          `You now have access to VIP predictions. ` +
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
