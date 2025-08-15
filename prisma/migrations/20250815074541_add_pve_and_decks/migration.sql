-- CreateTable
CREATE TABLE `ai_deck` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `difficulty` ENUM('EASY', 'MEDIUM', 'HARD', 'EXPERT') NOT NULL,
    `element` ENUM('FIRE', 'WATER', 'GRASS', 'ELECTRIC', 'PSYCHIC', 'FIGHTING', 'DARK', 'METAL', 'DRAGON', 'FAIRY', 'COLORLESS') NOT NULL,
    `cards` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ai_deck_difficulty_element_key`(`difficulty`, `element`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `opponent` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `portraitUrl` VARCHAR(191) NOT NULL,
    `intro` VARCHAR(191) NOT NULL DEFAULT '',
    `rewardCoins` INTEGER NOT NULL DEFAULT 50,
    `difficulty` ENUM('EASY', 'MEDIUM', 'HARD', 'EXPERT') NOT NULL,
    `element` ENUM('FIRE', 'WATER', 'GRASS', 'ELECTRIC', 'PSYCHIC', 'FIGHTING', 'DARK', 'METAL', 'DRAGON', 'FAIRY', 'COLORLESS') NOT NULL,
    `deckId` VARCHAR(191) NOT NULL,
    `unlocked` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `opponent_difficulty_element_key`(`difficulty`, `element`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pve_progress` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `difficulty` ENUM('EASY', 'MEDIUM', 'HARD', 'EXPERT') NOT NULL,
    `unlockedIds` JSON NOT NULL,
    `wins` INTEGER NOT NULL DEFAULT 0,
    `losses` INTEGER NOT NULL DEFAULT 0,
    `lastClearedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `pve_progress_userId_difficulty_key`(`userId`, `difficulty`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `battle` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `opponentId` VARCHAR(191) NOT NULL,
    `playerDeckId` VARCHAR(191) NOT NULL,
    `difficulty` ENUM('EASY', 'MEDIUM', 'HARD', 'EXPERT') NOT NULL,
    `status` ENUM('ACTIVE', 'COMPLETED', 'ABANDONED') NOT NULL DEFAULT 'ACTIVE',
    `state` JSON NOT NULL,
    `winner` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `endedAt` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `battle_action` (
    `id` VARCHAR(191) NOT NULL,
    `battleId` VARCHAR(191) NOT NULL,
    `turn` INTEGER NOT NULL,
    `actor` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `payload` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `opponent` ADD CONSTRAINT `opponent_deckId_fkey` FOREIGN KEY (`deckId`) REFERENCES `ai_deck`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pve_progress` ADD CONSTRAINT `pve_progress_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `battle` ADD CONSTRAINT `battle_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `battle` ADD CONSTRAINT `battle_opponentId_fkey` FOREIGN KEY (`opponentId`) REFERENCES `opponent`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `battle` ADD CONSTRAINT `battle_playerDeckId_fkey` FOREIGN KEY (`playerDeckId`) REFERENCES `deck`(`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `battle_action` ADD CONSTRAINT `battle_action_battleId_fkey` FOREIGN KEY (`battleId`) REFERENCES `battle`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
