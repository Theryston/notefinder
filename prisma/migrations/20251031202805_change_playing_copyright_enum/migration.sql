/*
  Warnings:

  - The values [NOT_ALLOWED,ALLOWED,ADMIN_ONLY,ALLOW_PLAY_AND_TRANSPOSE] on the enum `PlayingCopyright` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "PlayingCopyright_new" AS ENUM ('ALLOW_PLAY', 'ALLOW_TRANSPOSE', 'ALLOW_VOCALS_ONLY');
ALTER TYPE "PlayingCopyright" RENAME TO "PlayingCopyright_old";
ALTER TYPE "PlayingCopyright_new" RENAME TO "PlayingCopyright";
DROP TYPE "public"."PlayingCopyright_old";
COMMIT;
