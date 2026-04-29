-- CreateEnum
CREATE TYPE "AnalysisStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "SectionCategory" AS ENUM ('CACHING', 'DATABASE', 'SECURITY', 'ERROR_HANDLING', 'SCALABILITY', 'ARCHITECTURE', 'DEPLOYMENT');

-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('CRITICAL', 'WARNING', 'INFO');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "githubId" TEXT NOT NULL,
    "githubToken" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "image" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Repository" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "githubId" INTEGER NOT NULL,
    "fullName" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "language" TEXT,
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "url" TEXT NOT NULL,

    CONSTRAINT "Repository_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalysisReport" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "repositoryId" TEXT NOT NULL,
    "status" "AnalysisStatus" NOT NULL DEFAULT 'PENDING',
    "healthScore" INTEGER,
    "techStack" JSONB,
    "criticalCount" INTEGER NOT NULL DEFAULT 0,
    "warningCount" INTEGER NOT NULL DEFAULT 0,
    "infoCount" INTEGER NOT NULL DEFAULT 0,
    "filesAnalyzed" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "AnalysisReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportSection" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "category" "SectionCategory" NOT NULL,
    "title" TEXT NOT NULL,
    "severity" "Severity" NOT NULL,
    "issueCount" INTEGER NOT NULL DEFAULT 0,
    "order" INTEGER NOT NULL,

    CONSTRAINT "ReportSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportIssue" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" "Severity" NOT NULL,
    "filePath" TEXT,
    "lineNumber" INTEGER,
    "evidence" TEXT,
    "suggestion" TEXT NOT NULL,
    "codeExample" TEXT,

    CONSTRAINT "ReportIssue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_githubId_key" ON "User"("githubId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "Repository_githubId_key" ON "Repository"("githubId");

-- CreateIndex
CREATE INDEX "Repository_userId_idx" ON "Repository"("userId");

-- CreateIndex
CREATE INDEX "AnalysisReport_userId_idx" ON "AnalysisReport"("userId");

-- CreateIndex
CREATE INDEX "ReportSection_reportId_idx" ON "ReportSection"("reportId");

-- CreateIndex
CREATE INDEX "ReportIssue_sectionId_idx" ON "ReportIssue"("sectionId");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Repository" ADD CONSTRAINT "Repository_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalysisReport" ADD CONSTRAINT "AnalysisReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalysisReport" ADD CONSTRAINT "AnalysisReport_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "Repository"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportSection" ADD CONSTRAINT "ReportSection_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "AnalysisReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportIssue" ADD CONSTRAINT "ReportIssue_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "ReportSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
