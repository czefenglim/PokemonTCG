/*
  Warnings:

  - You are about to drop the `pokemon` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[username]` on the table `user` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[walletAddress]` on the table `user` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `walletAddress` to the `user` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `user` ADD COLUMN `walletAddress` VARCHAR(191) NOT NULL;

-- DropTable
DROP TABLE `pokemon`;

-- CreateTable
CREATE TABLE `friend_requests` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sender_id` VARCHAR(191) NOT NULL,
    `receiver_id` VARCHAR(191) NOT NULL,
    `status` ENUM('pending', 'accepted', 'rejected') NOT NULL DEFAULT 'pending',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `friends` (
    `user_id` VARCHAR(191) NOT NULL,
    `friend_id` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`user_id`, `friend_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TradeRequest` (
    `id` VARCHAR(191) NOT NULL,
    `sender_id` VARCHAR(191) NOT NULL,
    `receiver_id` VARCHAR(191) NOT NULL,
    `offeredCardId` INTEGER NOT NULL,
    `requestedCardId` INTEGER NULL,
    `senderStatus` ENUM('pending', 'accepted', 'declined') NOT NULL DEFAULT 'pending',
    `receiverStatus` ENUM('pending', 'accepted', 'declined') NOT NULL DEFAULT 'pending',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `TradeRequest_sender_id_idx`(`sender_id`),
    INDEX `TradeRequest_receiver_id_idx`(`receiver_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `user_username_key` ON `user`(`username`);

-- CreateIndex
CREATE UNIQUE INDEX `user_walletAddress_key` ON `user`(`walletAddress`);

-- AddForeignKey
ALTER TABLE `friend_requests` ADD CONSTRAINT `friend_requests_sender_id_fkey` FOREIGN KEY (`sender_id`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `friend_requests` ADD CONSTRAINT `friend_requests_receiver_id_fkey` FOREIGN KEY (`receiver_id`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `friends` ADD CONSTRAINT `friends_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `friends` ADD CONSTRAINT `friends_friend_id_fkey` FOREIGN KEY (`friend_id`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TradeRequest` ADD CONSTRAINT `TradeRequest_sender_id_fkey` FOREIGN KEY (`sender_id`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TradeRequest` ADD CONSTRAINT `TradeRequest_receiver_id_fkey` FOREIGN KEY (`receiver_id`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `user` RENAME INDEX `User_email_key` TO `user_email_key`;
