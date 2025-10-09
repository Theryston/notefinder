-- CreateTable
CREATE TABLE "track_views" (
    "id" TEXT NOT NULL,
    "track_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "track_views_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "track_views" ADD CONSTRAINT "track_views_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "track_views" ADD CONSTRAINT "track_views_track_id_fkey" FOREIGN KEY ("track_id") REFERENCES "tracks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
