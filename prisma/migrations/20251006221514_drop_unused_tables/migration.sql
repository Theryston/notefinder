/*
  Warnings:

  - You are about to drop the `authenticators` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `sessions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `verification_tokens` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."authenticators" DROP CONSTRAINT "authenticators_user_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."sessions" DROP CONSTRAINT "sessions_user_id_fkey";

-- DropTable
DROP TABLE "public"."authenticators";

-- DropTable
DROP TABLE "public"."sessions";

-- DropTable
DROP TABLE "public"."verification_tokens";
