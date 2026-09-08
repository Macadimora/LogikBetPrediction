import { prisma } from "@/lib/prisma";
import {
  sendPredictionPublishedNotifications,
} from "@/lib/prediction-notifications";

export async function publishScheduledPredictions() {
  const now = new Date();

  const duePredictions =
    await prisma.prediction.findMany({
      where: {
        status: "SCHEDULED",
        scheduledFor: {
          lte: now,
        },
      },

      select: {
        id: true,
      },

      orderBy: {
        scheduledFor: "asc",
      },
    });

  if (duePredictions.length === 0) {
    return {
      published: 0,
      notificationFailures: 0,
    };
  }

  let publishedCount = 0;
  let notificationFailures = 0;

  for (const prediction of duePredictions) {
    const updated =
      await prisma.prediction.updateMany({
        where: {
          id: prediction.id,
          status: "SCHEDULED",
          scheduledFor: {
            lte: now,
          },
        },

        data: {
          status: "PUBLISHED",
          publishedAt: now,
        },
      });

    if (updated.count === 0) {
      continue;
    }

    publishedCount += 1;

    try {
      await sendPredictionPublishedNotifications(
        prediction.id
      );
    } catch (error) {
      notificationFailures += 1;

      console.error(
        `Scheduled prediction notification failed for ${prediction.id}:`,
        error
      );
    }
  }

  return {
    published: publishedCount,
    notificationFailures,
  };
}
