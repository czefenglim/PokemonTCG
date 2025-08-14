-- CreateTable
CREATE TABLE `Room` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `isPrivate` BOOLEAN NOT NULL DEFAULT false,
    `password` VARCHAR(191) NULL,
    `players` INTEGER NOT NULL DEFAULT 1,
    `isFinished` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `creatorId` VARCHAR(191) NOT NULL,
    `winnerId` VARCHAR(191) NULL,
    `player1Id` VARCHAR(191) NOT NULL,
    `player2Id` VARCHAR(191) NULL,
    `player1DeckId` VARCHAR(191) NULL,
    `player2DeckId` VARCHAR(191) NULL,
    `player1Avatar` TEXT NULL,
    `player2Avatar` TEXT NULL,
    `player1Ready` BOOLEAN NOT NULL DEFAULT false,
    `player2Ready` BOOLEAN NOT NULL DEFAULT false,
    `wagerGems` INTEGER NULL,
    `wagerRarity` VARCHAR(50) NULL,
    `wagerCardId1` VARCHAR(191) NULL,
    `wagerCardId2` VARCHAR(191) NULL,

    INDEX `Room_isFinished_idx`(`isFinished`),
    INDEX `Room_createdAt_idx`(`createdAt`),
    INDEX `Room_winnerId_idx`(`winnerId`),
    INDEX `Room_player1Id_idx`(`player1Id`),
    INDEX `Room_player2Id_idx`(`player2Id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Room` ADD CONSTRAINT `Room_creatorId_fkey` FOREIGN KEY (`creatorId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Room` ADD CONSTRAINT `Room_player1Id_fkey` FOREIGN KEY (`player1Id`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Room` ADD CONSTRAINT `Room_player2Id_fkey` FOREIGN KEY (`player2Id`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Room` ADD CONSTRAINT `Room_winnerId_fkey` FOREIGN KEY (`winnerId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
