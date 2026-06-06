-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "GoalStatus" AS ENUM ('draft', 'confirmed', 'completed');

-- CreateEnum
CREATE TYPE "SkillSource" AS ENUM ('ai', 'custom');

-- CreateTable
CREATE TABLE "Goal" (
    "id" UUID NOT NULL,
    "hobby" VARCHAR(50) NOT NULL,
    "goal" VARCHAR(200) NOT NULL,
    "status" "GoalStatus" NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Goal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Skill" (
    "id" UUID NOT NULL,
    "goalId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "source" "SkillSource" NOT NULL,
    "whyItMatters" TEXT NOT NULL,
    "videoTitle" TEXT NOT NULL,
    "videoUrl" TEXT NOT NULL,
    "readingTitle" TEXT NOT NULL,
    "readingUrl" TEXT NOT NULL,
    "practiceTitle" TEXT NOT NULL,
    "practiceDescription" TEXT NOT NULL,
    "videoCompleted" BOOLEAN NOT NULL DEFAULT false,
    "readingCompleted" BOOLEAN NOT NULL DEFAULT false,
    "practiceCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Skill_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Goal_status_idx" ON "Goal"("status");

-- CreateIndex
CREATE INDEX "Skill_goalId_order_idx" ON "Skill"("goalId", "order");

-- AddForeignKey
ALTER TABLE "Skill" ADD CONSTRAINT "Skill_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
