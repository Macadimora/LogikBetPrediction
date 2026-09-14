import {
  NextRequest,
  NextResponse,
} from "next/server";

import { auth } from "@/auth";
import { syncApiFootballPredictions } from "@/lib/api-football-sync";

export async function POST(
  request: NextRequest
) {
  try {
    const authHeader =
      request.headers.get("authorization");

    const cronSecret =
      process.env.CRON_SECRET;

    const isCronRequest =
      cronSecret &&
      authHeader ===
        `Bearer ${cronSecret}`;

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
      await syncApiFootballPredictions();

    return NextResponse.json({
      success: true,
      message:
        "API-Football predictions synchronized successfully.",
      ...result,
    });
  } catch (error) {
    console.error(
      "API-Football sync error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Something went wrong while synchronizing API-Football predictions.",
      },
      {
        status: 500,
      }
    );
  }
}
