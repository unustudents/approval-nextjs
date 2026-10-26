-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `username` VARCHAR(50) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `name` VARCHAR(160) NOT NULL,
    `role` ENUM('REQUESTER', 'UNIT_MANAGER', 'CONSIDERATION', 'FINANCE_APPROVER', 'GENERAL_AFFAIRS', 'SUPERADMIN') NOT NULL,
    `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    `unitId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_username_key`(`username`),
    INDEX `User_unitId_role_status_idx`(`unitId`, `role`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Session` (
    `id` VARCHAR(191) NOT NULL,
    `tokenHash` CHAR(64) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Session_tokenHash_key`(`tokenHash`),
    INDEX `Session_userId_expiresAt_idx`(`userId`, `expiresAt`),
    INDEX `Session_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AuthAttempt` (
    `keyHash` CHAR(64) NOT NULL,
    `failedAttempts` INTEGER NOT NULL DEFAULT 0,
    `windowStartedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `AuthAttempt_windowStartedAt_idx`(`windowStartedAt`),
    PRIMARY KEY (`keyHash`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Unit` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    `managerId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Unit_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Category` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Category_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Workflow` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    `categoryId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Workflow_categoryId_key`(`categoryId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WorkflowStep` (
    `id` VARCHAR(191) NOT NULL,
    `workflowId` VARCHAR(191) NOT NULL,
    `order` INTEGER NOT NULL,
    `type` ENUM('APPROVAL', 'CONSIDERATION') NOT NULL,
    `targetType` ENUM('UNIT_MANAGER', 'ROLE', 'USER') NOT NULL,
    `targetRole` ENUM('REQUESTER', 'UNIT_MANAGER', 'CONSIDERATION', 'FINANCE_APPROVER', 'GENERAL_AFFAIRS', 'SUPERADMIN') NULL,
    `targetUserId` VARCHAR(191) NULL,
    `required` BOOLEAN NOT NULL DEFAULT true,
    `allowRevision` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `WorkflowStep_workflowId_order_idx`(`workflowId`, `order`),
    UNIQUE INDEX `WorkflowStep_workflowId_order_key`(`workflowId`, `order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Submission` (
    `id` VARCHAR(191) NOT NULL,
    `number` VARCHAR(32) NOT NULL,
    `requesterId` VARCHAR(191) NOT NULL,
    `unitId` VARCHAR(191) NOT NULL,
    `categoryId` VARCHAR(191) NOT NULL,
    `purpose` VARCHAR(2000) NOT NULL,
    `status` ENUM('DRAFT', 'WAITING_UNIT_MANAGER', 'WAITING_CONSIDERATION', 'WAITING_APPROVAL', 'WAITING_FINANCE', 'NEEDS_REVISION', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'DRAFT',
    `currentStepId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `submittedAt` DATETIME(3) NULL,
    `approvedAt` DATETIME(3) NULL,
    `decidedAt` DATETIME(3) NULL,

    UNIQUE INDEX `Submission_number_key`(`number`),
    INDEX `Submission_requesterId_createdAt_idx`(`requesterId`, `createdAt`),
    INDEX `Submission_unitId_status_createdAt_idx`(`unitId`, `status`, `createdAt`),
    INDEX `Submission_categoryId_status_idx`(`categoryId`, `status`),
    INDEX `Submission_status_submittedAt_idx`(`status`, `submittedAt`),
    UNIQUE INDEX `Submission_currentStepId_key`(`currentStepId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SubmissionItem` (
    `id` VARCHAR(191) NOT NULL,
    `submissionId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(200) NOT NULL,
    `quantity` INTEGER NOT NULL,
    `description` VARCHAR(1000) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `SubmissionItem_submissionId_idx`(`submissionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SubmissionStep` (
    `id` VARCHAR(191) NOT NULL,
    `submissionId` VARCHAR(191) NOT NULL,
    `workflowStepId` VARCHAR(191) NULL,
    `order` INTEGER NOT NULL,
    `type` ENUM('APPROVAL', 'CONSIDERATION') NOT NULL,
    `targetType` ENUM('UNIT_MANAGER', 'ROLE', 'USER') NOT NULL,
    `targetRole` ENUM('REQUESTER', 'UNIT_MANAGER', 'CONSIDERATION', 'FINANCE_APPROVER', 'GENERAL_AFFAIRS', 'SUPERADMIN') NULL,
    `targetUserId` VARCHAR(191) NULL,
    `required` BOOLEAN NOT NULL DEFAULT true,
    `allowRevision` BOOLEAN NOT NULL DEFAULT false,
    `status` ENUM('PENDING', 'COMPLETED', 'SKIPPED') NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `SubmissionStep_submissionId_status_order_idx`(`submissionId`, `status`, `order`),
    INDEX `SubmissionStep_targetUserId_status_idx`(`targetUserId`, `status`),
    INDEX `SubmissionStep_targetRole_status_idx`(`targetRole`, `status`),
    UNIQUE INDEX `SubmissionStep_submissionId_order_key`(`submissionId`, `order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ApprovalAction` (
    `id` VARCHAR(191) NOT NULL,
    `submissionId` VARCHAR(191) NOT NULL,
    `submissionStepId` VARCHAR(191) NULL,
    `actorId` VARCHAR(191) NOT NULL,
    `action` ENUM('APPROVED', 'REJECTED', 'REVISION_REQUESTED', 'CONSIDERATION_GIVEN', 'RESUBMITTED', 'SUBMITTED', 'EDITED', 'SKIPPED') NOT NULL,
    `note` VARCHAR(2000) NULL,
    `resultingStatus` ENUM('DRAFT', 'WAITING_UNIT_MANAGER', 'WAITING_CONSIDERATION', 'WAITING_APPROVAL', 'WAITING_FINANCE', 'NEEDS_REVISION', 'APPROVED', 'REJECTED') NOT NULL,
    `snapshot` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ApprovalAction_submissionId_createdAt_idx`(`submissionId`, `createdAt`),
    INDEX `ApprovalAction_actorId_createdAt_idx`(`actorId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SubmissionRevision` (
    `id` VARCHAR(191) NOT NULL,
    `submissionId` VARCHAR(191) NOT NULL,
    `version` INTEGER NOT NULL,
    `snapshot` JSON NOT NULL,
    `editedById` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `SubmissionRevision_submissionId_createdAt_idx`(`submissionId`, `createdAt`),
    UNIQUE INDEX `SubmissionRevision_submissionId_version_key`(`submissionId`, `version`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Attachment` (
    `id` VARCHAR(191) NOT NULL,
    `submissionId` VARCHAR(191) NOT NULL,
    `originalFilename` VARCHAR(255) NOT NULL,
    `storageKey` VARCHAR(500) NOT NULL,
    `mimeType` VARCHAR(120) NOT NULL,
    `sizeBytes` INTEGER NOT NULL,
    `uploadedById` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Attachment_storageKey_key`(`storageKey`),
    INDEX `Attachment_submissionId_createdAt_idx`(`submissionId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Notification` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `submissionId` VARCHAR(191) NOT NULL,
    `type` ENUM('ACTION_REQUIRED', 'STATUS_CHANGED') NOT NULL,
    `message` VARCHAR(500) NOT NULL,
    `readAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Notification_userId_readAt_createdAt_idx`(`userId`, `readAt`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_unitId_fkey` FOREIGN KEY (`unitId`) REFERENCES `Unit`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Session` ADD CONSTRAINT `Session_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Unit` ADD CONSTRAINT `Unit_managerId_fkey` FOREIGN KEY (`managerId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Workflow` ADD CONSTRAINT `Workflow_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `Category`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WorkflowStep` ADD CONSTRAINT `WorkflowStep_workflowId_fkey` FOREIGN KEY (`workflowId`) REFERENCES `Workflow`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WorkflowStep` ADD CONSTRAINT `WorkflowStep_targetUserId_fkey` FOREIGN KEY (`targetUserId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Submission` ADD CONSTRAINT `Submission_requesterId_fkey` FOREIGN KEY (`requesterId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Submission` ADD CONSTRAINT `Submission_unitId_fkey` FOREIGN KEY (`unitId`) REFERENCES `Unit`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Submission` ADD CONSTRAINT `Submission_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `Category`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Submission` ADD CONSTRAINT `Submission_currentStepId_fkey` FOREIGN KEY (`currentStepId`) REFERENCES `SubmissionStep`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SubmissionItem` ADD CONSTRAINT `SubmissionItem_submissionId_fkey` FOREIGN KEY (`submissionId`) REFERENCES `Submission`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SubmissionStep` ADD CONSTRAINT `SubmissionStep_submissionId_fkey` FOREIGN KEY (`submissionId`) REFERENCES `Submission`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SubmissionStep` ADD CONSTRAINT `SubmissionStep_workflowStepId_fkey` FOREIGN KEY (`workflowStepId`) REFERENCES `WorkflowStep`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SubmissionStep` ADD CONSTRAINT `SubmissionStep_targetUserId_fkey` FOREIGN KEY (`targetUserId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ApprovalAction` ADD CONSTRAINT `ApprovalAction_submissionId_fkey` FOREIGN KEY (`submissionId`) REFERENCES `Submission`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ApprovalAction` ADD CONSTRAINT `ApprovalAction_submissionStepId_fkey` FOREIGN KEY (`submissionStepId`) REFERENCES `SubmissionStep`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ApprovalAction` ADD CONSTRAINT `ApprovalAction_actorId_fkey` FOREIGN KEY (`actorId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SubmissionRevision` ADD CONSTRAINT `SubmissionRevision_submissionId_fkey` FOREIGN KEY (`submissionId`) REFERENCES `Submission`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SubmissionRevision` ADD CONSTRAINT `SubmissionRevision_editedById_fkey` FOREIGN KEY (`editedById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Attachment` ADD CONSTRAINT `Attachment_submissionId_fkey` FOREIGN KEY (`submissionId`) REFERENCES `Submission`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Attachment` ADD CONSTRAINT `Attachment_uploadedById_fkey` FOREIGN KEY (`uploadedById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_submissionId_fkey` FOREIGN KEY (`submissionId`) REFERENCES `Submission`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
