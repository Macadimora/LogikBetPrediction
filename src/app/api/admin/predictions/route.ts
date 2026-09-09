import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

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

    /*
     * Upcoming predictions first.
     *
     * The closest upcoming fixture appears
     * at the top of the admin page.
     */
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

    /*
     * Keep past predictions available to
     * the admin, but place them underneath
     * all upcoming predictions.
     *
     * Most recently played matches appear
     * first within the historical section.
     */
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

    const predictions = [
      ...upcomingPredictions,
      ...pastPredictions,
    ];

    return NextResponse.json({
      success: true,
      predictions,
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