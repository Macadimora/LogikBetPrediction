import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import { syncPlayerEloPredictions } from "@/lib/playerelo-sync";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");

    const cronSecret = process.env.CRON_SECRET;

    const isCronRequest =
      cronSecret &&
      authHeader === `Bearer ${cronSecret}`;

    if (!isCronRequest) {
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
    }

    const result =
      await syncPlayerEloPredictions();

    return NextResponse.json({
      success: true,
      message:
        "PlayerElo predictions synchronized successfully.",
      ...result,
    });
  } catch (error) {
    console.error(
      "PlayerElo sync error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Something went wrong while synchronizing PlayerElo predictions.",
      },
      {
        status: 500,
      }
    );
  }
}