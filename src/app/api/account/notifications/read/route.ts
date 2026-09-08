import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    const body = await request.json();

    const notificationId =
      typeof body.notificationId === "string"
        ? body.notificationId.trim()
        : "";

    const markAll =
      body.markAll === true;

    /*
     * Mark every unread notification
     * belonging to the logged-in user
     * as read.
     */
    if (markAll) {
      const result =
        await prisma.notification.updateMany({
          where: {
            userId: session.user.id,
            readAt: null,
          },

          data: {
            readAt: new Date(),
          },
        });

      return NextResponse.json({
        success: true,
        message:
          "All notifications marked as read.",
        updated: result.count,
      });
    }

    /*
     * Otherwise a specific notification
     * ID must be supplied.
     */
    if (!notificationId) {
      return NextResponse.json(
        {
          error:
            "Notification ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Make sure the notification actually
     * belongs to the logged-in user.
     */
    const notification =
      await prisma.notification.findFirst({
        where: {
          id: notificationId,
          userId: session.user.id,
        },

        select: {
          id: true,
          readAt: true,
        },
      });

    if (!notification) {
      return NextResponse.json(
        {
          error:
            "Notification not found.",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * If it has already been read we can
     * safely return success without making
     * another database update.
     */
    if (notification.readAt) {
      return NextResponse.json({
        success: true,
        message:
          "Notification is already read.",
        notification,
      });
    }

    const updatedNotification =
      await prisma.notification.update({
        where: {
          id: notification.id,
        },

        data: {
          readAt: new Date(),
        },

        select: {
          id: true,
          readAt: true,
        },
      });

    return NextResponse.json({
      success: true,
      message:
        "Notification marked as read.",
      notification:
        updatedNotification,
    });
  } catch (error) {
    console.error(
      "Notification read update error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Something went wrong while updating the notification.",
      },
      {
        status: 500,
      }
    );
  }
}
