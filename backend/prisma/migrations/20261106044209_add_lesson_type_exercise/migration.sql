-- CreateEnum
CREATE TYPE "LessonType" AS ENUM ('VOCAB', 'GRAMMAR', 'CHECKPOINT');

-- AlterTable
ALTER TABLE "Lesson" ADD COLUMN     "noteMd" TEXT,
ADD COLUMN     "type" "LessonType" NOT NULL DEFAULT 'VOCAB';

-- CreateTable
CREATE TABLE "Exercise" (
    "id" SERIAL NOT NULL,
    "lessonId" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "explanationVi" TEXT,
    "mediaUrl" TEXT,

    CONSTRAINT "Exercise_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Exercise_lessonId_order_key" ON "Exercise"("lessonId", "order");

-- AddForeignKey
ALTER TABLE "Exercise" ADD CONSTRAINT "Exercise_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;
