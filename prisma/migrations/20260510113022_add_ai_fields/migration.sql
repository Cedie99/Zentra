-- AlterTable
ALTER TABLE "AnalysisReport" ADD COLUMN     "aiSummary" TEXT;

-- AlterTable
ALTER TABLE "ReportIssue" ADD COLUMN     "isAiAdded" BOOLEAN NOT NULL DEFAULT false;
