-- CreateTable
CREATE TABLE "nfp_audio_processes" (
    "id" TEXT NOT NULL,
    "track_id" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "instance_type" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nfp_audio_processes_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "nfp_audio_processes" ADD CONSTRAINT "nfp_audio_processes_track_id_fkey" FOREIGN KEY ("track_id") REFERENCES "tracks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
