import { prisma } from "@/lib/prisma";

import {
  createSubscriptionActivatedNotification,
  createSubscriptionExpiredNotification,
} from "@/lib/subscription-notifications";

export async function expireOldSubscriptions(
  userId?: string
) {
  const now = new Date();

  /*
   * STEP 1:
   * Expire ACTIVE subscriptions whose
   * expiry time has already passed.
   */
  const expiredSubscriptions =
    await prisma.subscription.findMany({
      where: {
        ...(userId
          ? {
              userId,
            }
          : {}),

        status: "ACTIVE",

        expiresAt: {
          lte: now,
        },
      },

      select: {
        id: true,
        userId: true,
        plan: true,
        startsAt: true,
        expiresAt: true,
      },
    });

  let expiredCount = 0;

  for (const subscription of expiredSubscriptions) {
    const updated =
      await prisma.subscription.updateMany({
        where: {
          id: subscription.id,
          status: "ACTIVE",
          expiresAt: {
            lte: now,
          },
        },

        data: {
          status: "EXPIRED",
        },
      });

    if (updated.count === 0) {
      continue;
    }

    expiredCount += 1;

    try {
      await createSubscriptionExpiredNotification({
        userId: subscription.userId,
        subscriptionId: subscription.id,
        plan: subscription.plan,
        expiresAt: subscription.expiresAt,
      });
    } catch (error) {
      console.error(
        "Subscription expiration notification error:",
        error
      );
    }
  }

  /*
   * STEP 2:
   * Find PENDING subscriptions whose
   * scheduled start time has arrived.
   */
  const pendingSubscriptions =
    await prisma.subscription.findMany({
      where: {
        ...(userId
          ? {
              userId,
            }
          : {}),

        status: "PENDING",

        startsAt: {
          lte: now,
        },

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

      orderBy: {
        startsAt: "asc",
      },

      select: {
        id: true,
        userId: true,
        plan: true,
        startsAt: true,
        expiresAt: true,
      },
    });

  let activatedCount = 0;

  for (const subscription of pendingSubscriptions) {
    /*
     * Do not activate another plan while
     * the user still has a valid ACTIVE one.
     */
    const activeSubscription =
      await prisma.subscription.findFirst({
        where: {
          userId: subscription.userId,

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

        select: {
          id: true,
        },
      });

    if (activeSubscription) {
      continue;
    }

    /*
     * Claim this pending subscription.
     */
    const activated =
      await prisma.subscription.updateMany({
        where: {
          id: subscription.id,
          status: "PENDING",
          startsAt: {
            lte: now,
          },
        },

        data: {
          status: "ACTIVE",
        },
      });

    if (activated.count === 0) {
      continue;
    }

    activatedCount += 1;

    /*
     * Create an activation notification.
     *
     * Failure here must not undo the
     * subscription activation.
     */
    try {
      await createSubscriptionActivatedNotification({
        userId: subscription.userId,
        subscriptionId: subscription.id,
        plan: subscription.plan,
        startsAt: subscription.startsAt,
        expiresAt: subscription.expiresAt,
      });
    } catch (error) {
      console.error(
        "Subscription activation notification error:",
        error
      );
    }
  }

  return {
    expired: expiredCount,
    activated: activatedCount,
  };
}
