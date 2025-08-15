/*
  Warnings:

  - The values [EXPERT] on the enum `battle_difficulty` will be removed. If these variants are still used in the database, this will fail.
  - The values [ELECTRIC,DARK] on the enum `opponent_element` will be removed. If these variants are still used in the database, this will fail.
  - The values [EXPERT] on the enum `battle_difficulty` will be removed. If these variants are still used in the database, this will fail.
  - The values [COMPLETED] on the enum `battle_status` will be removed. If these variants are still used in the database, this will fail.
  - The values [EXPERT] on the enum `battle_difficulty` will be removed. If these variants are still used in the database, this will fail.
  - The values [ELECTRIC,DARK] on the enum `opponent_element` will be removed. If these variants are still used in the database, this will fail.
  - The values [EXPERT] on the enum `battle_difficulty` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `ai_deck` MODIFY `difficulty` ENUM('EASY', 'MEDIUM', 'HARD') NOT NULL,
    MODIFY `element` ENUM('FIRE', 'WATER', 'GRASS', 'LIGHTNING', 'PSYCHIC', 'FIGHTING', 'DARKNESS', 'METAL', 'DRAGON', 'FAIRY', 'COLORLESS') NOT NULL;

-- AlterTable
ALTER TABLE `battle` MODIFY `difficulty` ENUM('EASY', 'MEDIUM', 'HARD') NOT NULL,
    MODIFY `status` ENUM('PENDING', 'ACTIVE', 'WON', 'LOST', 'ABANDONED') NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE `opponent` MODIFY `difficulty` ENUM('EASY', 'MEDIUM', 'HARD') NOT NULL,
    MODIFY `element` ENUM('FIRE', 'WATER', 'GRASS', 'LIGHTNING', 'PSYCHIC', 'FIGHTING', 'DARKNESS', 'METAL', 'DRAGON', 'FAIRY', 'COLORLESS') NOT NULL;

-- AlterTable
ALTER TABLE `pve_progress` MODIFY `difficulty` ENUM('EASY', 'MEDIUM', 'HARD') NOT NULL;
