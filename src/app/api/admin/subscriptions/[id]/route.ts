import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(
  request: Request,
  { params }: Props
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

    const status = body.status as
      | "ACTIVE"
      | "CANCELLED";

    if (
      status !== "ACTIVE" &&
      status !== "CANCELLED"
    ) {
      return NextResponse.json(
        {
          error: "Invalid subscription status.",
        },
        {
          status: 400,
        }
      );
    }

    const subscription =
      await prisma.subscription.findUnique({
        where: {
          id,
        },
      });

    if (!subscription) {
      return NextResponse.json(
        {
          error: "Subscription not found.",
        },
        {
          status: 404,
        }
      );
    }

    if (
      status === "ACTIVE" &&
      subscription.expiresAt &&
      subscription.expiresAt <= new Date()
    ) {
      return NextResponse.json(
        {
          error:
            "An expired subscription cannot be reactivated. Extend or create a new subscription instead.",
        },
        {
          status: 400,
        }
      );
    }

    const updatedSubscription =
      await prisma.subscription.update({
        where: {
          id,
        },
        data: {
          status,
        },
      });

    return NextResponse.json({
      success: true,
      subscription: updatedSubscription,
    });
  } catch (error) {
    console.error(
      "Admin subscription update error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Something went wrong while updating the subscription.",
      },
      {
        status: 500,
      }
    );
  }
}
