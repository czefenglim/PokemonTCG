/*
  Warnings:

  - You are about to drop the column `category` on the `merchandise` table. All the data in the column will be lost.
  - You are about to drop the column `digitalBonus` on the `merchandise` table. All the data in the column will be lost.
  - You are about to drop the column `features` on the `merchandise` table. All the data in the column will be lost.
  - You are about to drop the column `inStock` on the `merchandise` table. All the data in the column will be lost.
  - You are about to drop the column `limitedEdition` on the `merchandise` table. All the data in the column will be lost.
  - You are about to drop the column `originalPrice` on the `merchandise` table. All the data in the column will be lost.
  - You are about to drop the column `rarity` on the `merchandise` table. All the data in the column will be lost.
  - You are about to drop the column `rating` on the `merchandise` table. All the data in the column will be lost.
  - You are about to drop the column `reviews` on the `merchandise` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `merchandise` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `merchandise` DROP COLUMN `category`,
    DROP COLUMN `digitalBonus`,
    DROP COLUMN `features`,
    DROP COLUMN `inStock`,
    DROP COLUMN `limitedEdition`,
    DROP COLUMN `originalPrice`,
    DROP COLUMN `rarity`,
    DROP COLUMN `rating`,
    DROP COLUMN `reviews`,
    DROP COLUMN `type`;
