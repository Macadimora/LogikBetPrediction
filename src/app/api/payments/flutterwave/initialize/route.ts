import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

import {
  SUBSCRIPTION_PLANS,
  SubscriptionPlanKey,
} from "@/lib/subscription-plans";

export async function POST(
  request: Request
) {
  let paymentId:
    | string
    | null = null;

  try {
    const session = await auth();

    if (
      !session?.user?.id ||
      !session.user.email
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

    const body =
      await request.json();

    const plan =
      body.plan as SubscriptionPlanKey;

    if (
      !plan ||
      !SUBSCRIPTION_PLANS[plan]
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid subscription plan.",
        },
        {
          status: 400,
        }
      );
    }

    const selectedPlan =
      SUBSCRIPTION_PLANS[plan];

    const flutterwaveSecretKey =
      process.env.FLW_SECRET_KEY;

    if (!flutterwaveSecretKey) {
      return NextResponse.json(
        {
          error:
            "Flutterwave is not configured.",
        },
        {
          status: 500,
        }
      );
    }

    const appUrl =
      process.env
        .NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000";

    const reference =
      `LOGIKBET-${session.user.id}-${Date.now()}`;

    const payment =
      await prisma.payment.create({
        data: {
          userId:
            session.user.id,

          provider:
            "FLUTTERWAVE",

          reference,

          amount:
            selectedPlan.amount,

          currency: "NGN",

          status: "PENDING",

          metadata: {
            plan,
          },
        },
      });

    paymentId = payment.id;

    const response =
      await fetch(
        "https://api.flutterwave.com/v3/payments",
        {
          method: "POST",

          headers: {
            Authorization:
              `Bearer ${flutterwaveSecretKey}`,

            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            tx_ref: reference,

            amount:
              selectedPlan.amount /
              100,

            currency: "NGN",

            redirect_url:
              `${appUrl}/api/payments/flutterwave/callback`,

            customer: {
              email:
                session.user.email,

              name:
                session.user.name ||
                "LogikBet User",
            },

            customizations: {
              title:
                "LogikBetPrediction VIP",

              description:
                selectedPlan.description,
            },

            meta: {
              userId:
                session.user.id,

              paymentId:
                payment.id,

              plan,
            },
          }),
        }
      );

    let result: {
      status?: string;
      message?: string;

      data?: {
        link?: string;
      };
    };

    try {
      result =
        await response.json();
    } catch (error) {
      console.error(
        "Flutterwave returned an invalid response:",
        error
      );

      await markPaymentFailed(
        payment.id
      );

      return NextResponse.json(
        {
          error:
            "Unable to initialize Flutterwave payment.",
        },
        {
          status: 502,
        }
      );
    }

    if (
      !response.ok ||
      result.status !==
        "success" ||
      !result.data?.link
    ) {
      await markPaymentFailed(
        payment.id
      );

      console.error(
        "Flutterwave initialization error:",
        {
          httpStatus:
            response.status,

          status:
            result.status,

          message:
            result.message,
        }
      );

      return NextResponse.json(
        {
          error:
            "Unable to initialize Flutterwave payment.",
        },
        {
          status: 502,
        }
      );
    }

    return NextResponse.json({
      success: true,

      checkoutUrl:
        result.data.link,

      reference,
    });
  } catch (error) {
    console.error(
      "Flutterwave initialize error:",
      error
    );

    if (paymentId) {
      await markPaymentFailed(
        paymentId
      );
    }

    return NextResponse.json(
      {
        error:
          "Something went wrong while initializing payment.",
      },
      {
        status: 500,
      }
    );
  }
}

async function markPaymentFailed(
  paymentId: string
) {
  try {
    await prisma.payment.updateMany({
      where: {
        id: paymentId,
        status: "PENDING",
      },

      data: {
        status: "FAILED",
      },
    });
  } catch (error) {
    console.error(
      "Failed to update unsuccessful payment:",
      error
    );
  }
}
