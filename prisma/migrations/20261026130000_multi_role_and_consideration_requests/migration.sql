-- Preserve each existing single role as the account's first role, then move to a many-role model.
CREATE TABLE `UserRole` (
    `userId` VARCHAR(191) NOT NULL,
    `role` ENUM('REQUESTER', 'UNIT_MANAGER', 'CONSIDERATION', 'FINANCE_APPROVER', 'GENERAL_AFFAIRS', 'SUPERADMIN') NOT NULL,
    `assignedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `UserRole_role_userId_idx`(`role`, `userId`),
    PRIMARY KEY (`userId`, `role`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `UserRole` (`userId`, `role`)
SELECT `id`, `role` FROM `User`;

CREATE INDEX `User_unitId_status_idx` ON `User`(`unitId`, `status`);
ALTER TABLE `User` DROP INDEX `User_unitId_role_status_idx`;
ALTER TABLE `User` DROP COLUMN `role`;

ALTER TABLE `ApprovalAction`
    MODIFY `action` ENUM('APPROVED', 'REJECTED', 'REVISION_REQUESTED', 'CONSIDERATION_GIVEN', 'CONSIDERATION_REQUESTED', 'RESUBMITTED', 'SUBMITTED', 'EDITED', 'SKIPPED') NOT NULL,
    ADD COLUMN `actorRole` ENUM('REQUESTER', 'UNIT_MANAGER', 'CONSIDERATION', 'FINANCE_APPROVER', 'GENERAL_AFFAIRS', 'SUPERADMIN') NULL;

CREATE TABLE `ConsiderationRequest` (
    `id` VARCHAR(191) NOT NULL,
    `submissionId` VARCHAR(191) NOT NULL,
    `requestedById` VARCHAR(191) NOT NULL,
    `recipientId` VARCHAR(191) NOT NULL,
    `message` VARCHAR(2000) NOT NULL,
    `response` VARCHAR(2000) NULL,
    `status` ENUM('PENDING', 'RESPONDED') NOT NULL DEFAULT 'PENDING',
    `respondedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ConsiderationRequest_submissionId_createdAt_idx`(`submissionId`, `createdAt`),
    INDEX `ConsiderationRequest_recipientId_status_createdAt_idx`(`recipientId`, `status`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `UserRole` ADD CONSTRAINT `UserRole_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `ConsiderationRequest` ADD CONSTRAINT `ConsiderationRequest_submissionId_fkey` FOREIGN KEY (`submissionId`) REFERENCES `Submission`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `ConsiderationRequest` ADD CONSTRAINT `ConsiderationRequest_requestedById_fkey` FOREIGN KEY (`requestedById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `ConsiderationRequest` ADD CONSTRAINT `ConsiderationRequest_recipientId_fkey` FOREIGN KEY (`recipientId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
