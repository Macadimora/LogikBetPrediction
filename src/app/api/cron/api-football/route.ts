import { NextResponse } from "next/server";

import { syncApiFootballPredictions } from "@/lib/api-football-sync";

export async function GET(request: Request) {
  try {
    const cronSecret =
      process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error(
        "CRON_SECRET is not configured."
      );

      return NextResponse.json(
        {
          error:
            "Cron endpoint is not configured.",
        },
        {
          status: 500,
        }
      );
    }

    const authorization =
      request.headers.get(
        "authorization"
      );

    if (
      authorization !==
      `Bearer ${cronSecret}`
    ) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    const result =
      await syncApiFootballPredictions();

    return NextResponse.json({
      success: true,
      message:
        "Automatic API-Football synchronization completed successfully.",
      ...result,
    });
  } catch (error) {
    console.error(
      "API-Football cron sync error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Automatic API-Football synchronization failed.",
      },
      {
        status: 500,
      }
    );
  }
}
