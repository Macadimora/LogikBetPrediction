-- AlterTable
ALTER TABLE "SiteSetting" ADD COLUMN     "heroDescription" TEXT NOT NULL DEFAULT 'Access daily football predictions powered by fixture data, probability analysis and structured match insights. Start free or unlock more with VIP.',
ADD COLUMN     "heroHeading" TEXT NOT NULL DEFAULT 'Football insights built for',
ADD COLUMN     "heroHighlight" TEXT NOT NULL DEFAULT 'smarter decisions.',
ADD COLUMN     "themeColor" TEXT NOT NULL DEFAULT '#f59e0b';
