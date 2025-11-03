/*
  Warnings:

  - You are about to drop the `nfp_audio_spot_requests` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."nfp_audio_spot_requests" DROP CONSTRAINT "nfp_audio_spot_requests_track_id_fkey";

-- DropTable
DROP TABLE "public"."nfp_audio_spot_requests";
