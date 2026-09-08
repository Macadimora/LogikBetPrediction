-- CreateTable
CREATE TABLE "WhatsAppIntegration" (
    "id" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "provider" TEXT NOT NULL DEFAULT 'META',
    "accessToken" TEXT,
    "phoneNumberId" TEXT,
    "apiVersion" TEXT NOT NULL DEFAULT 'v23.0',
    "predictionTemplateName" TEXT NOT NULL DEFAULT 'new_prediction',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsAppIntegration_pkey" PRIMARY KEY ("id")
);
