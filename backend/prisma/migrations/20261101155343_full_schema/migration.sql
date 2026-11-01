/*
  Warnings:

  - Added the required column `updatedAt` to the `Deck` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');

-- CreateEnum
CREATE TYPE "PartOfSpeech" AS ENUM ('NOUN', 'VERB', 'ADJECTIVE', 'ADVERB', 'PREPOSITION', 'CONJUNCTION', 'PRONOUN', 'INTERJECTION', 'PHRASE', 'OTHER');

-- CreateEnum
CREATE TYPE "ChatRole" AS ENUM ('USER', 'ASSISTANT');

-- DropForeignKey
ALTER TABLE "Deck" DROP CONSTRAINT "Deck_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "Progress" DROP CONSTRAINT "Progress_userId_fkey";

-- AlterTable
ALTER TABLE "Deck" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "difficulty" "Difficulty" NOT NULL DEFAULT 'BEGINNER',
ADD COLUMN     "emoji" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Progress" ADD COLUMN     "correctCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lastReviewedAt" TIMESTAMP(3),
ADD COLUMN     "wrongCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "avatar" TEXT,
ADD COLUMN     "dailyGoal" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN     "longestStreak" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Word" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "exampleMeaning" TEXT,
ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "partOfSpeech" "PartOfSpeech" NOT NULL DEFAULT 'OTHER';

-- CreateTable
CREATE TABLE "QuizAttempt" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "deckId" INTEGER NOT NULL,
    "totalQuestions" INTEGER NOT NULL,
    "correctAnswers" INTEGER NOT NULL,
    "durationSec" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuizAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudyLog" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "wordsLearned" INTEGER NOT NULL DEFAULT 0,
    "wordsReview" INTEGER NOT NULL DEFAULT 0,
    "minutes" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "StudyLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "role" "ChatRole" NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "QuizAttempt_userId_createdAt_idx" ON "QuizAttempt"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "StudyLog_userId_date_key" ON "StudyLog"("userId", "date");

-- CreateIndex
CREATE INDEX "ChatMessage_userId_createdAt_idx" ON "ChatMessage"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Deck_ownerId_idx" ON "Deck"("ownerId");

-- CreateIndex
CREATE INDEX "Deck_topic_idx" ON "Deck"("topic");

-- CreateIndex
CREATE INDEX "Progress_userId_nextReviewAt_idx" ON "Progress"("userId", "nextReviewAt");

-- CreateIndex
CREATE INDEX "Progress_userId_isFavorite_idx" ON "Progress"("userId", "isFavorite");

-- CreateIndex
CREATE INDEX "Word_deckId_idx" ON "Word"("deckId");

-- AddForeignKey
ALTER TABLE "Deck" ADD CONSTRAINT "Deck_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Progress" ADD CONSTRAINT "Progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizAttempt" ADD CONSTRAINT "QuizAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizAttempt" ADD CONSTRAINT "QuizAttempt_deckId_fkey" FOREIGN KEY ("deckId") REFERENCES "Deck"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyLog" ADD CONSTRAINT "StudyLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
