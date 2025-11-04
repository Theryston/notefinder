-- CreateEnum
CREATE TYPE "Runtime" AS ENUM ('AWS', 'RUNPOD');

-- CreateTable
CREATE TABLE "settings" (
    "id" TEXT NOT NULL,
    "runtime" "Runtime" NOT NULL DEFAULT 'AWS',
    "uses_gpu" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);
