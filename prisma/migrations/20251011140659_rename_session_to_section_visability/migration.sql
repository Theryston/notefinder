/*
  Warnings:

  - You are about to drop the `user_session_visibilities` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "UserSectionVisibilityValue" AS ENUM ('PUBLIC', 'ME_ONLY');

-- DropForeignKey
ALTER TABLE "public"."user_session_visibilities" DROP CONSTRAINT "user_session_visibilities_user_id_fkey";

-- DropTable
DROP TABLE "public"."user_session_visibilities";

-- DropEnum
DROP TYPE "public"."UserSessionVisibilityValue";

-- CreateTable
CREATE TABLE "user_section_visibilities" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" "UserSectionVisibilityValue" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_section_visibilities_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "user_section_visibilities" ADD CONSTRAINT "user_section_visibilities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
