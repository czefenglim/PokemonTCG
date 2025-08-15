-- AlterTable
ALTER TABLE `room` ADD COLUMN `isFinished` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `winnerId` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `creatorId_idx` ON `room`(`creatorId`);

-- CreateIndex
CREATE INDEX `winnerId_idx` ON `room`(`winnerId`);

-- AddForeignKey
ALTER TABLE `room` ADD CONSTRAINT `room_creatorId_fkey` FOREIGN KEY (`creatorId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `room` ADD CONSTRAINT `room_winnerId_fkey` FOREIGN KEY (`winnerId`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;
