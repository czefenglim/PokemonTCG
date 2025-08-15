-- AlterTable
ALTER TABLE `merchandise` ADD COLUMN `category` VARCHAR(191) NULL,
    ADD COLUMN `features` JSON NULL,
    ADD COLUMN `inStock` BOOLEAN NULL,
    ADD COLUMN `limitedEdition` BOOLEAN NULL,
    ADD COLUMN `rarity` VARCHAR(191) NULL,
    ADD COLUMN `rating` DOUBLE NULL,
    ADD COLUMN `reviews` INTEGER NULL,
    ADD COLUMN `type` VARCHAR(191) NULL;
