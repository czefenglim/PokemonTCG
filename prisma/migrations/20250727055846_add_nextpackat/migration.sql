/*
  Warnings:

  - You are about to drop the column `lastPackOpened` on the `user` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `user` DROP COLUMN `lastPackOpened`,
    ADD COLUMN `nextPackAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);
