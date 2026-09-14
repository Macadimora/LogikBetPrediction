import {
  NextRequest,
  NextResponse,
} from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type ManualPredictionBody = {
  leagueName?: unknown;
  homeTeam?: unknown;
  awayTeam?: unknown;
  kickoffTime?: unknown;
  pHome?: unknown;
  pDraw?: unknown;
  pAway?: unknown;
  predictedHomeScore?: unknown;
  predictedAwayScore?: unknown;
  confidence?: unknown;
  title?: unknown;
  analysis?: unknown;
  status?: unknown;
  scheduledFor?: unknown;
};

const ALLOWED_STATUSES = new Set([
  "DRAFT",
  "SCHEDULED",
  "PUBLISHED",
]);

function requiredText(
  value: unknown,
  fieldName: string
): string {
  if (
    typeof value !== "string" ||
    !value.trim()
  ) {
    throw new Error(
      `${fieldName} is required.`
    );
  }

  return value.trim();
}

function optionalText(
  value: unknown
): string | null {
  if (typeof value !== "string") {
    return null;
  }

  return value.trim() || null;
}

function probability(
  value: unknown,
  fieldName: string
): number {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string" &&
          value.trim()
        ? Number(value)
        : Number.NaN;

  if (!Number.isFinite(parsed)) {
    throw new Error(
      `${fieldName} must be a number.`
    );
  }

  const normalized =
    parsed > 1 ? parsed / 100 : parsed;

  if (
    normalized < 0 ||
    normalized > 1
  ) {
    throw new Error(
      `${fieldName} must be between 0 and 1, or 0 and 100%.`
    );
  }

  return normalized;
}

function score(
  value: unknown,
  fieldName: string
): number {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string" &&
          value.trim()
        ? Number(value)
        : Number.NaN;

  if (
    !Number.isInteger(parsed) ||
    parsed < 0
  ) {
    throw new Error(
      `${fieldName} must be a non-negative whole number.`
    );
  }

  return parsed;
}

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    const now = new Date();

    const upcomingPredictions =
      await prisma.prediction.findMany({
        where: {
          pHome: { not: null },
          pDraw: { not: null },
          pAway: { not: null },
          fixture: {
            kickoffTime: {
              gte: now,
            },
          },
        },
        include: {
          fixture: true,
        },
        orderBy: {
          fixture: {
            kickoffTime: "asc",
          },
        },
      });

    const pastPredictions =
      await prisma.prediction.findMany({
        where: {
          pHome: { not: null },
          pDraw: { not: null },
          pAway: { not: null },
          fixture: {
            kickoffTime: {
              lt: now,
            },
          },
        },
        include: {
          fixture: true,
        },
        orderBy: {
          fixture: {
            kickoffTime: "desc",
          },
        },
      });

    return NextResponse.json({
      success: true,
      predictions: [
        ...upcomingPredictions,
        ...pastPredictions,
      ],
    });
  } catch (error) {
    console.error(
      "Admin predictions error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to fetch predictions",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(
  request: NextRequest
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    const body =
      (await request.json()) as ManualPredictionBody;

    const leagueName = requiredText(
      body.leagueName,
      "League"
    );

    const homeTeam = requiredText(
      body.homeTeam,
      "Home team"
    );

    const awayTeam = requiredText(
      body.awayTeam,
      "Away team"
    );

    if (
      homeTeam.toLowerCase() ===
      awayTeam.toLowerCase()
    ) {
      throw new Error(
        "Home and away teams must be different."
      );
    }

    const kickoffValue = requiredText(
      body.kickoffTime,
      "Kickoff time"
    );

    const kickoffTime =
      new Date(kickoffValue);

    if (
      Number.isNaN(
        kickoffTime.getTime()
      )
    ) {
      throw new Error(
        "Kickoff time is invalid."
      );
    }

    if (
      kickoffTime.getTime() <=
      Date.now()
    ) {
      throw new Error(
        "Kickoff time must be in the future."
      );
    }

    const pHome = probability(
      body.pHome,
      "Home probability"
    );

    const pDraw = probability(
      body.pDraw,
      "Draw probability"
    );

    const pAway = probability(
      body.pAway,
      "Away probability"
    );

    const probabilityTotal =
      pHome + pDraw + pAway;

    if (
      Math.abs(
        probabilityTotal - 1
      ) > 0.02
    ) {
      throw new Error(
        "Home, draw and away probabilities must total 100%."
      );
    }

    const predictedHomeScore = score(
      body.predictedHomeScore,
      "Predicted home score"
    );

    const predictedAwayScore = score(
      body.predictedAwayScore,
      "Predicted away score"
    );

    const confidence =
      body.confidence === undefined ||
      body.confidence === null ||
      body.confidence === ""
        ? Math.max(
            pHome,
            pDraw,
            pAway
          )
        : probability(
            body.confidence,
            "Confidence"
          );

    const requestedStatus =
      typeof body.status === "string"
        ? body.status.toUpperCase()
        : "DRAFT";

    if (
      !ALLOWED_STATUSES.has(
        requestedStatus
      )
    ) {
      throw new Error(
        "Status must be DRAFT, SCHEDULED or PUBLISHED."
      );
    }

    let scheduledFor: Date | null =
      null;

    if (
      requestedStatus ===
      "SCHEDULED"
    ) {
      const scheduledValue =
        requiredText(
          body.scheduledFor,
          "Scheduled publication time"
        );

      scheduledFor =
        new Date(scheduledValue);

      if (
        Number.isNaN(
          scheduledFor.getTime()
        ) ||
        scheduledFor.getTime() <=
          Date.now()
      ) {
        throw new Error(
          "Scheduled publication time must be in the future."
        );
      }

      if (
        scheduledFor.getTime() >=
        kickoffTime.getTime()
      ) {
        throw new Error(
          "Scheduled publication must occur before kickoff."
        );
      }
    }

    const prediction =
      await prisma.$transaction(
        async (transaction) => {
          const lowestManualFixture =
            await transaction.fixture.findFirst({
              where: {
                externalId: {
                  lt: 0,
                },
              },
              orderBy: {
                externalId: "asc",
              },
              select: {
                externalId: true,
              },
            });

          const externalId =
            (
              lowestManualFixture?.externalId ??
              0
            ) - 1;

          const fixture =
            await transaction.fixture.create({
              data: {
                externalId,
                kickoffTime,
                leagueId: null,
                leagueName,
                homeTeam,
                awayTeam,
                status: "NS",
              },
            });

          return transaction.prediction.create({
            data: {
              fixtureId: fixture.id,
              access: "FREE",
              source: "ADMIN",
              status:
                requestedStatus as
                  | "DRAFT"
                  | "SCHEDULED"
                  | "PUBLISHED",
              pHome,
              pDraw,
              pAway,
              predictedHomeScore,
              predictedAwayScore,
              confidence,
              title:
                optionalText(
                  body.title
                ),
              analysis:
                optionalText(
                  body.analysis
                ),
              manualOverride: true,
              publishedAt:
                requestedStatus ===
                "PUBLISHED"
                  ? new Date()
                  : null,
              scheduledFor,
            },
            include: {
              fixture: true,
            },
          });
        }
      );

    return NextResponse.json(
      {
        success: true,
        message:
          "Manual prediction created successfully.",
        prediction,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Manual prediction creation error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create manual prediction.",
      },
      {
        status: 400,
      }
    );
  }
}