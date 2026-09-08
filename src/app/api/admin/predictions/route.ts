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

    const predictions = await prisma.prediction.findMany({
      where: {
        pHome: { not: null },
        pDraw: { not: null },
        pAway: { not: null },
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

    return NextResponse.json({
      success: true,
      predictions,
    });
  } catch (error) {
    console.error("Admin predictions error:", error);

    return NextResponse.json(
      { error: "Failed to fetch predictions" },
      { status: 500 }
    );
  }
}
