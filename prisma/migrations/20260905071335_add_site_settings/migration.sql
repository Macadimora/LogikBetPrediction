-- CreateTable
CREATE TABLE "SiteSetting" (
    "id" TEXT NOT NULL,
    "siteName" TEXT NOT NULL DEFAULT 'LogikBetPrediction',
    "logoUrl" TEXT,
    "homeLabel" TEXT NOT NULL DEFAULT 'Home',
    "predictionsLabel" TEXT NOT NULL DEFAULT 'Predictions',
    "vipLabel" TEXT NOT NULL DEFAULT 'VIP Plans',
    "primaryCtaLabel" TEXT NOT NULL DEFAULT 'Get VIP',
    "primaryCtaUrl" TEXT NOT NULL DEFAULT '/subscribe',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSetting_pkey" PRIMARY KEY ("id")
);
