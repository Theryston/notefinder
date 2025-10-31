-- CreateEnum
CREATE TYPE "PlayingCopyright" AS ENUM ('NOT_ALLOWED', 'ALLOWED', 'ADMIN_ONLY');

-- AlterTable
ALTER TABLE "tracks" ADD COLUMN     "music_mp3_url" TEXT,
ADD COLUMN     "playing_copyright" "PlayingCopyright" NOT NULL DEFAULT 'NOT_ALLOWED',
ADD COLUMN     "vocals_mp3_url" TEXT;
