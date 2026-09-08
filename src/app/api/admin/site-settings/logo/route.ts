import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { put } from "@vercel/blob";
import crypto from "crypto";

const MAX_FILE_SIZE = 2 * 1024 * 1024;

const ALLOWED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
];

function getExtension(
  mimeType: string
) {
  switch (mimeType) {
    case "image/png":
      return "png";

    case "image/jpeg":
      return "jpg";

    case "image/webp":
      return "webp";

    default:
      return null;
  }
}

export async function POST(
  request: Request
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

    if (
      session.user.role !== "ADMIN"
    ) {
      return NextResponse.json(
        {
          error: "Forbidden",
        },
        {
          status: 403,
        }
      );
    }

    const formData =
      await request.formData();

    const file =
      formData.get("logo");

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          error:
            "Please select a logo image.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !ALLOWED_TYPES.includes(
        file.type
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Logo must be PNG, JPG or WEBP.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      file.size > MAX_FILE_SIZE
    ) {
      return NextResponse.json(
        {
          error:
            "Logo must be 2MB or smaller.",
        },
        {
          status: 400,
        }
      );
    }

    const extension =
      getExtension(file.type);

    if (!extension) {
      return NextResponse.json(
        {
          error:
            "Unsupported image format.",
        },
        {
          status: 400,
        }
      );
    }

    const filename =
      `site/logo-${Date.now()}-${crypto
        .randomBytes(8)
        .toString("hex")}.${extension}`;

    const blob = await put(
      filename,
      file,
      {
        access: "public",
        addRandomSuffix: false,
        contentType: file.type,
      }
    );

    return NextResponse.json({
      success: true,
      logoUrl: blob.url,
    });
  } catch (error) {
    console.error(
      "Logo upload error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to upload logo.",
      },
      {
        status: 500,
      }
    );
  }
}
