import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendPredictionPublishedNotifications } from "@/lib/prediction-notifications";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(
  request: NextRequest,
  { params }: RouteContext
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

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        {
          error: "Forbidden",
        },
        {
          status: 403,
        }
      );
    }

    const { id } = await params;
    const body = await request.json();

    const existingPrediction =
      await prisma.prediction.findUnique({
        where: {
          id,
        },
      });

    if (!existingPrediction) {
      return NextResponse.json(
        {
          error: "Prediction not found",
        },
        {
          status: 404,
        }
      );
    }

    const pHome =
      body.pHome === null || body.pHome === ""
        ? null
        : body.pHome === undefined
          ? existingPrediction.pHome
          : Number(body.pHome);

    const pDraw =
      body.pDraw === null || body.pDraw === ""
        ? null
        : body.pDraw === undefined
          ? existingPrediction.pDraw
          : Number(body.pDraw);

    const pAway =
      body.pAway === null || body.pAway === ""
        ? null
        : body.pAway === undefined
          ? existingPrediction.pAway
          : Number(body.pAway);

    const confidence =
      body.confidence === null || body.confidence === ""
        ? null
        : body.confidence === undefined
          ? existingPrediction.confidence
          : Number(body.confidence);

    const predictedHomeScore =
      body.predictedHomeScore === null ||
      body.predictedHomeScore === ""
        ? null
        : body.predictedHomeScore === undefined
          ? existingPrediction.predictedHomeScore
          : Number(body.predictedHomeScore);

    const predictedAwayScore =
      body.predictedAwayScore === null ||
      body.predictedAwayScore === ""
        ? null
        : body.predictedAwayScore === undefined
          ? existingPrediction.predictedAwayScore
          : Number(body.predictedAwayScore);

    if (
      pHome !== null &&
      (Number.isNaN(pHome) || pHome < 0 || pHome > 1)
    ) {
      return NextResponse.json(
        {
          error:
            "Home probability must be between 0 and 1",
        },
        {
          status: 400,
        }
      );
    }

    if (
      pDraw !== null &&
      (Number.isNaN(pDraw) || pDraw < 0 || pDraw > 1)
    ) {
      return NextResponse.json(
        {
          error:
            "Draw probability must be between 0 and 1",
        },
        {
          status: 400,
        }
      );
    }

    if (
      pAway !== null &&
      (Number.isNaN(pAway) || pAway < 0 || pAway > 1)
    ) {
      return NextResponse.json(
        {
          error:
            "Away probability must be between 0 and 1",
        },
        {
          status: 400,
        }
      );
    }

    const probabilitiesProvided =
      pHome !== null &&
      pDraw !== null &&
      pAway !== null;

    if (probabilitiesProvided) {
      const total = pHome + pDraw + pAway;

      if (Math.abs(total - 1) > 0.02) {
        return NextResponse.json(
          {
            error:
              "Home, draw and away probabilities should add up to approximately 1.",
          },
          {
            status: 400,
          }
        );
      }
    }

    if (
      confidence !== null &&
      (Number.isNaN(confidence) ||
        confidence < 0 ||
        confidence > 1)
    ) {
      return NextResponse.json(
        {
          error:
            "Confidence must be between 0 and 1",
        },
        {
          status: 400,
        }
      );
    }

    if (
      predictedHomeScore !== null &&
      (!Number.isInteger(predictedHomeScore) ||
        predictedHomeScore < 0)
    ) {
      return NextResponse.json(
        {
          error:
            "Predicted home score must be a non-negative integer",
        },
        {
          status: 400,
        }
      );
    }

    if (
      predictedAwayScore !== null &&
      (!Number.isInteger(predictedAwayScore) ||
        predictedAwayScore < 0)
    ) {
      return NextResponse.json(
        {
          error:
            "Predicted away score must be a non-negative integer",
        },
        {
          status: 400,
        }
      );
    }

    const allowedStatuses = [
      "DRAFT",
      "SCHEDULED",
      "PUBLISHED",
      "COMPLETED",
      "CANCELLED",
    ];

    if (
      body.status &&
      !allowedStatuses.includes(body.status)
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid prediction status",
        },
        {
          status: 400,
        }
      );
    }

    const nextStatus =
      body.status ?? existingPrediction.status;

    /*
     * Work out the intended scheduled date.
     */
    let scheduledFor: Date | null =
      existingPrediction.scheduledFor;

    if (nextStatus === "SCHEDULED") {
      if (
        body.scheduledFor === null ||
        body.scheduledFor === "" ||
        body.scheduledFor === undefined
      ) {
        return NextResponse.json(
          {
            error:
              "A scheduled prediction must have a publication date and time.",
          },
          {
            status: 400,
          }
        );
      }

      const parsedScheduledFor = new Date(
        body.scheduledFor
      );

      if (
        Number.isNaN(
          parsedScheduledFor.getTime()
        )
      ) {
        return NextResponse.json(
          {
            error:
              "Scheduled publication date is invalid.",
          },
          {
            status: 400,
          }
        );
      }

      if (
        parsedScheduledFor.getTime() <=
        Date.now()
      ) {
        return NextResponse.json(
          {
            error:
              "Scheduled publication time must be in the future.",
          },
          {
            status: 400,
          }
        );
      }

      scheduledFor = parsedScheduledFor;
    } else {
      /*
       * Once a prediction is no longer scheduled,
       * clear its scheduled publication date.
       */
      scheduledFor = null;
    }

    /*
     * Published and scheduled predictions
     * should not be incomplete.
     */
    if (
      (
        nextStatus === "PUBLISHED" ||
        nextStatus === "SCHEDULED"
      ) &&
      !probabilitiesProvided
    ) {
      return NextResponse.json(
        {
          error:
            "Published or scheduled predictions must have home, draw and away probabilities.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * A prediction is considered manually overridden when
     * an admin changes any AI-generated prediction content.
     *
     * Status/scheduling changes alone do not disable future
     * PlayerElo/AI refreshes.
     */
    const manualContentFields = [
      "pHome",
      "pDraw",
      "pAway",
      "predictedHomeScore",
      "predictedAwayScore",
      "confidence",
      "title",
      "analysis",
    ] as const;

    const hasManualContentEdit =
      manualContentFields.some((field) =>
        Object.prototype.hasOwnProperty.call(
          body,
          field
        )
      );

    const updatedPrediction =
      await prisma.prediction.update({
        where: {
          id,
        },
        data: {
          pHome,
          pDraw,
          pAway,
          predictedHomeScore,
          predictedAwayScore,
          confidence,
          title:
            typeof body.title === "string"
              ? body.title.trim() || null
              : existingPrediction.title,
          analysis:
            typeof body.analysis === "string"
              ? body.analysis.trim() || null
              : existingPrediction.analysis,
          status: nextStatus,
          scheduledFor,
          manualOverride:
            hasManualContentEdit
              ? true
              : existingPrediction.manualOverride,
          publishedAt:
            nextStatus === "PUBLISHED"
              ? existingPrediction.publishedAt ??
                new Date()
              : nextStatus !== "PUBLISHED"
                ? null
                : existingPrediction.publishedAt,
        },
        include: {
          fixture: true,
        },
      });

    const wasJustPublished =
      existingPrediction.status !== "PUBLISHED" &&
      updatedPrediction.status === "PUBLISHED";

    let notificationResult = null;

    if (wasJustPublished) {
      try {
        notificationResult =
          await sendPredictionPublishedNotifications(
            updatedPrediction.id
          );
      } catch (error) {
        console.error(
          "Prediction notification error:",
          error
        );

        notificationResult = {
          sent: 0,
          failed: 0,
          skipped: true,
        };
      }
    }

    return NextResponse.json({
      success: true,
      message:
        "Prediction updated successfully.",
      prediction:
        updatedPrediction,
      notifications:
        notificationResult,
    });
  } catch (error) {
    console.error(
      "Update prediction error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to update prediction.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteContext
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

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        {
          error: "Forbidden",
        },
        {
          status: 403,
        }
      );
    }

    const { id } = await params;

    const prediction =
      await prisma.prediction.findUnique({
        where: {
          id,
        },
      });

    if (!prediction) {
      return NextResponse.json(
        {
          error:
            "Prediction not found",
        },
        {
          status: 404,
        }
      );
    }

    await prisma.prediction.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      success: true,
      message:
        "Prediction deleted successfully.",
    });
  } catch (error) {
    console.error(
      "Delete prediction error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to delete prediction.",
      },
      {
        status: 500,
      }
    );
  }
}
