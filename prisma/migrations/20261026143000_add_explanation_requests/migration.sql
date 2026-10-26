ALTER TABLE `ApprovalAction`
    MODIFY `action` ENUM('APPROVED', 'REJECTED', 'REVISION_REQUESTED', 'CONSIDERATION_GIVEN', 'CONSIDERATION_REQUESTED', 'EXPLANATION_REQUESTED', 'EXPLANATION_GIVEN', 'RESUBMITTED', 'SUBMITTED', 'EDITED', 'SKIPPED') NOT NULL;

CREATE TABLE `ExplanationRequest` (
    `id` VARCHAR(191) NOT NULL,
    `submissionId` VARCHAR(191) NOT NULL,
    `requestedById` VARCHAR(191) NOT NULL,
    `recipientId` VARCHAR(191) NOT NULL,
    `question` VARCHAR(2000) NOT NULL,
    `answer` VARCHAR(2000) NULL,
    `status` ENUM('PENDING', 'ANSWERED') NOT NULL DEFAULT 'PENDING',
    `answeredAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ExplanationRequest_submissionId_createdAt_idx`(`submissionId`, `createdAt`),
    INDEX `ExplanationRequest_recipientId_status_createdAt_idx`(`recipientId`, `status`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `ExplanationRequest` ADD CONSTRAINT `ExplanationRequest_submissionId_fkey` FOREIGN KEY (`submissionId`) REFERENCES `Submission`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `ExplanationRequest` ADD CONSTRAINT `ExplanationRequest_requestedById_fkey` FOREIGN KEY (`requestedById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `ExplanationRequest` ADD CONSTRAINT `ExplanationRequest_recipientId_fkey` FOREIGN KEY (`recipientId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
