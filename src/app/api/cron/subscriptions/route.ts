import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  expireOldSubscriptions,
} from "@/lib/subscriptions";

export async function GET(
  request: NextRequest
) {
  try {
    const authorization =
      request.headers.get(
        "authorization"
      );

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
      await expireOldSubscriptions();

    return NextResponse.json({
      success: true,
      expired: result.expired,
      activated: result.activated,
    });
  } catch (error) {
    console.error(
      "Subscription cron error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Failed to process subscriptions.",
      },
      {
        status: 500,
      }
    );
  }
}
