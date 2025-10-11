-- CreateEnum
CREATE TYPE "UserSessionVisibilityValue" AS ENUM ('PUBLIC', 'ME_ONLY');

-- CreateTable
CREATE TABLE "user_session_visibilities" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" "UserSessionVisibilityValue" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_session_visibilities_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "user_session_visibilities" ADD CONSTRAINT "user_session_visibilities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
