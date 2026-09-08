-- DropIndex
DROP INDEX "Notification_channel_idx";

-- DropIndex
DROP INDEX "Notification_createdAt_idx";

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "readAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Notification_readAt_idx" ON "Notification"("readAt");
