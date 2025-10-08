/*
  Warnings:

  - Added the required column `creator_id` to the `tracks` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TrackStatus" AS ENUM ('QUEUED', 'DOWNLOADING_THUMBNAILS', 'DOWNLOADING_VIDEO', 'EXTRACTING_LYRICS', 'EXTRACTING_VOCALS', 'DETECTING_VOCALS_NOTES', 'ERROR', 'COMPLETED');

-- AlterTable
ALTER TABLE "tracks" ADD COLUMN     "creator_id" TEXT NOT NULL,
ADD COLUMN     "job_id" TEXT,
ADD COLUMN     "status" "TrackStatus" NOT NULL DEFAULT 'QUEUED',
ADD COLUMN     "status_description" TEXT;

-- AddForeignKey
ALTER TABLE "tracks" ADD CONSTRAINT "tracks_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
