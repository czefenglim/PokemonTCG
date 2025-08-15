/*
  Warnings:

  - You are about to alter the column `status` on the `transaction` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(5))` to `Enum(EnumId(5))`.

*/
-- AlterTable
ALTER TABLE `transaction` MODIFY `status` ENUM('SHIPPED', 'COMPLETED') NOT NULL;
