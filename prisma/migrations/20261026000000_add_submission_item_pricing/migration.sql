-- AlterTable
ALTER TABLE `SubmissionItem`
    ADD COLUMN `unitPrice` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    ADD COLUMN `specification` VARCHAR(2000) NOT NULL DEFAULT '';
