import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import ThemeProvider from "@/components/ThemeProvider";
import { prisma } from "@/lib/prisma";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LogikBetPrediction",
  description:
    "Football predictions, VIP tips, subscriptions and match insights.",
};

const DEFAULT_BRAND_COLOR = "#f59e0b";
const DARK_FOREGROUND = "#020617";
const LIGHT_FOREGROUND = "#ffffff";

function isValidHexColor(value: string | null | undefined) {
  if (!value) {
    return false;
  }

  return /^#[0-9A-Fa-f]{6}$/.test(value);
}

function hexToRgb(hex: string) {
  const normalized = hex.replace("#", "");

  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
  };
}

function getRelativeLuminance(hex: string) {
  const { r, g, b } = hexToRgb(hex);

  const channels = [r, g, b].map((value) => {
    const srgb = value / 255;

    return srgb <= 0.03928
      ? srgb / 12.92
      : Math.pow((srgb + 0.055) / 1.055, 2.4);
  });

  return (
    0.2126 * channels[0] +
    0.7152 * channels[1] +
    0.0722 * channels[2]
  );
}

function getContrastRatio(
  firstLuminance: number,
  secondLuminance: number
) {
  const lighter = Math.max(
    firstLuminance,
    secondLuminance
  );

  const darker = Math.min(
    firstLuminance,
    secondLuminance
  );

  return (lighter + 0.05) / (darker + 0.05);
}

function getBrandForeground(brandColor: string) {
  const brandLuminance =
    getRelativeLuminance(brandColor);

  const darkLuminance =
    getRelativeLuminance(DARK_FOREGROUND);

  const lightLuminance =
    getRelativeLuminance(LIGHT_FOREGROUND);

  const darkContrast =
    getContrastRatio(
      brandLuminance,
      darkLuminance
    );

  const lightContrast =
    getContrastRatio(
      brandLuminance,
      lightLuminance
    );

  return darkContrast >= lightContrast
    ? DARK_FOREGROUND
    : LIGHT_FOREGROUND;
}

async function getBrandColor() {
  try {
    const settings =
      await prisma.siteSetting.findFirst({
        orderBy: {
          createdAt: "asc",
        },

        select: {
          themeColor: true,
        },
      });

    if (
      settings &&
      isValidHexColor(settings.themeColor)
    ) {
      return settings.themeColor;
    }

    return DEFAULT_BRAND_COLOR;
  } catch (error) {
    console.error(
      "Failed to load global brand color:",
      error
    );

    return DEFAULT_BRAND_COLOR;
  }
}

export default async function RootLayout({
  children,
}: LayoutProps<"/">) {
  const brandColor =
    await getBrandColor();

  const brandForeground =
    getBrandForeground(brandColor);

  const themeStyle = {
    "--brand": brandColor,
    "--brand-foreground": brandForeground,
  } as CSSProperties;

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body
        className="min-h-full flex flex-col"
        style={themeStyle}
      >
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
