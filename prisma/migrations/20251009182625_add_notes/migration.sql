-- CreateTable
CREATE TABLE "track_notes" (
    "id" TEXT NOT NULL,
    "track_id" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "octave" INTEGER NOT NULL,
    "start" DOUBLE PRECISION NOT NULL,
    "end" DOUBLE PRECISION NOT NULL,
    "frequency_mean" DOUBLE PRECISION NOT NULL,
    "creator_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "track_notes_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "track_notes" ADD CONSTRAINT "track_notes_track_id_fkey" FOREIGN KEY ("track_id") REFERENCES "tracks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "track_notes" ADD CONSTRAINT "track_notes_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
