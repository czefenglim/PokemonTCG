-- DropForeignKey
ALTER TABLE `deck` DROP FOREIGN KEY `Deck_userId_fkey`;

-- AddForeignKey
ALTER TABLE `deck` ADD CONSTRAINT `Deck_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
