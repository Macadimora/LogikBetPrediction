import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  publishScheduledPredictions,
} from "@/lib/scheduled-predictions";

export async function GET(
  request: NextRequest
) {
  try {
    const authorization =
      request.headers.get("authorization");

    const expectedToken =
      process.env.CRON_SECRET;

    if (!expectedToken) {
      return NextResponse.json(
        {
          error:
            "CRON_SECRET is not configured.",
        },
        {
          status: 500,
        }
      );
    }

    if (
      authorization !==
      `Bearer ${expectedToken}`
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
      await publishScheduledPredictions();

    return NextResponse.json({
      success: true,
      published:
        result.published,
      notificationFailures:
        result.notificationFailures,
    });
  } catch (error) {
    console.error(
      "Scheduled prediction cron error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Failed to publish scheduled predictions.",
      },
      {
        status: 500,
      }
    );
  }
}
