-- CreateTable
CREATE TABLE "daily_practice_streaks" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "day" DATE NOT NULL,
    "listened_seconds" INTEGER NOT NULL DEFAULT 0,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "completed_at" TIMESTAMP(3),
    "last_heartbeat_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_practice_streaks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "daily_practice_streaks_user_id_is_completed_idx" ON "daily_practice_streaks"("user_id", "is_completed");

-- CreateIndex
CREATE UNIQUE INDEX "daily_practice_streaks_user_id_day_key" ON "daily_practice_streaks"("user_id", "day");

-- AddForeignKey
ALTER TABLE "daily_practice_streaks" ADD CONSTRAINT "daily_practice_streaks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
