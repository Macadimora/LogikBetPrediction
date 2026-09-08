import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/;

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

    let settings =
      await prisma.siteSetting.findFirst({
        orderBy: {
          createdAt: "asc",
        },
      });

    if (!settings) {
      settings =
        await prisma.siteSetting.create({
          data: {},
        });
    }

    return NextResponse.json({
      settings,
    });
  } catch (error) {
    console.error(
      "Site settings GET error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to load site settings.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function PATCH(
  request: Request
) {
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

    const body = await request.json();

    const siteName =
      typeof body.siteName === "string"
        ? body.siteName.trim()
        : "";

    const logoUrl =
      typeof body.logoUrl === "string"
        ? body.logoUrl.trim()
        : "";

    const homeLabel =
      typeof body.homeLabel === "string"
        ? body.homeLabel.trim()
        : "";

    const predictionsLabel =
      typeof body.predictionsLabel ===
      "string"
        ? body.predictionsLabel.trim()
        : "";

    const vipLabel =
      typeof body.vipLabel === "string"
        ? body.vipLabel.trim()
        : "";

    const primaryCtaLabel =
      typeof body.primaryCtaLabel ===
      "string"
        ? body.primaryCtaLabel.trim()
        : "";

    const primaryCtaUrl =
      typeof body.primaryCtaUrl ===
      "string"
        ? body.primaryCtaUrl.trim()
        : "";

    const themeColor =
      typeof body.themeColor === "string"
        ? body.themeColor.trim()
        : "";

    const heroHeading =
      typeof body.heroHeading === "string"
        ? body.heroHeading.trim()
        : "";

    const heroHighlight =
      typeof body.heroHighlight ===
      "string"
        ? body.heroHighlight.trim()
        : "";

    const heroDescription =
      typeof body.heroDescription ===
      "string"
        ? body.heroDescription.trim()
        : "";

    if (
      !siteName ||
      !homeLabel ||
      !predictionsLabel ||
      !vipLabel ||
      !primaryCtaLabel ||
      !primaryCtaUrl ||
      !themeColor ||
      !heroHeading ||
      !heroHighlight ||
      !heroDescription
    ) {
      return NextResponse.json(
        {
          error:
            "All fields except logo URL are required.",
        },
        {
          status: 400,
        }
      );
    }

    if (siteName.length > 100) {
      return NextResponse.json(
        {
          error:
            "Site name must be 100 characters or fewer.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      homeLabel.length > 50 ||
      predictionsLabel.length > 50 ||
      vipLabel.length > 50 ||
      primaryCtaLabel.length > 50
    ) {
      return NextResponse.json(
        {
          error:
            "Navigation labels must be 50 characters or fewer.",
        },
        {
          status: 400,
        }
      );
    }

    if (!HEX_COLOR_REGEX.test(themeColor)) {
      return NextResponse.json(
        {
          error:
            "Theme color must be a valid 6-digit HEX color, for example #f59e0b.",
        },
        {
          status: 400,
        }
      );
    }

    if (heroHeading.length > 150) {
      return NextResponse.json(
        {
          error:
            "Homepage heading must be 150 characters or fewer.",
        },
        {
          status: 400,
        }
      );
    }

    if (heroHighlight.length > 100) {
      return NextResponse.json(
        {
          error:
            "Highlighted heading text must be 100 characters or fewer.",
        },
        {
          status: 400,
        }
      );
    }

    if (heroDescription.length > 500) {
      return NextResponse.json(
        {
          error:
            "Homepage paragraph must be 500 characters or fewer.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      logoUrl &&
      !logoUrl.startsWith("/") &&
      !logoUrl.startsWith("https://")
    ) {
      return NextResponse.json(
        {
          error:
            "Logo URL must be a local path beginning with / or a valid HTTPS URL.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !primaryCtaUrl.startsWith("/") &&
      !primaryCtaUrl.startsWith(
        "https://"
      )
    ) {
      return NextResponse.json(
        {
          error:
            "CTA URL must be a local path beginning with / or a valid HTTPS URL.",
        },
        {
          status: 400,
        }
      );
    }

    let settings =
      await prisma.siteSetting.findFirst({
        orderBy: {
          createdAt: "asc",
        },
      });

    const data = {
      siteName,
      logoUrl: logoUrl || null,
      homeLabel,
      predictionsLabel,
      vipLabel,
      primaryCtaLabel,
      primaryCtaUrl,
      themeColor,
      heroHeading,
      heroHighlight,
      heroDescription,
    };

    if (!settings) {
      settings =
        await prisma.siteSetting.create({
          data,
        });
    } else {
      settings =
        await prisma.siteSetting.update({
          where: {
            id: settings.id,
          },
          data,
        });
    }

    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error(
      "Site settings PATCH error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to update site settings.",
      },
      {
        status: 500,
      }
    );
  }
}