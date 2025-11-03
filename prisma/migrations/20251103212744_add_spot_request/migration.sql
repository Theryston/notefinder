-- CreateTable
CREATE TABLE "nfp_audio_process_spot_requests" (
    "id" TEXT NOT NULL,
    "track_id" TEXT NOT NULL,
    "spot_id" TEXT NOT NULL,
    "is_canceled" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nfp_audio_process_spot_requests_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "nfp_audio_process_spot_requests" ADD CONSTRAINT "nfp_audio_process_spot_requests_track_id_fkey" FOREIGN KEY ("track_id") REFERENCES "tracks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
