-- CreateTable
CREATE TABLE "track_calculation_jobs" (
    "id" TEXT NOT NULL,
    "track_id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "start_at" TIMESTAMP(3) NOT NULL,
    "end_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "track_calculation_jobs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "track_calculation_jobs" ADD CONSTRAINT "track_calculation_jobs_track_id_fkey" FOREIGN KEY ("track_id") REFERENCES "tracks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
