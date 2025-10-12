import type {
  AuditAction,
  AuditActorRole,
  AuditEntityType,
  VerificationMethod,
  VerificationStatus,
} from '@/generated/prisma';
import { VerificationFileRole } from '@/generated/prisma';
import { auditServerAction } from '@/lib/audit/audit';
import { getEnhancedAuditContext } from '@/lib/audit/audit-context';
import { prisma } from '@/lib/db';
import { mimeFromStorageKey } from '@/lib/image_system/image-utils-server';

export async function getLatestVerification(userId: string): Promise<{
  id: number;
  status: VerificationStatus;
  method: VerificationMethod;
  cityId: number;
  submittedAt: Date;
  reviewedAt?: Date | null;
  rejectionCode?: string | null;
  rejectionNote?: string | null;
} | null> {
  const verification = await prisma.verificationRequest.findFirst({
    where: { userId },
    orderBy: { submittedAt: 'desc' },
    select: {
      id: true,
      status: true,
      method: true,
      cityId: true,
      submittedAt: true,
      reviewedAt: true,
      rejectionCode: true,
      rejectionNote: true,
    },
  });

  return verification;
}

export async function submitVerificationRequest(
  userId: string,
  data: {
    method: VerificationMethod;
    userNote?: string;
    files: {
      storageKey: string;
      mimeType?: string | null;
      bytes?: number | null;
      role?: VerificationFileRole;
    }[];
  }
): Promise<{ requestId: number }> {
  // Get user info for audit context
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { cityId: true, role: true },
  });

  const auditContext = await getEnhancedAuditContext();

  return await auditServerAction(
    'VERIFICATION_SUBMIT' as AuditAction,
    'VERIFICATION_REQUEST' as AuditEntityType,
    async () => {
      // Check if user already has a pending verification
      const existingPending = await prisma.verificationRequest.findFirst({
        where: { userId, status: 'PENDING' },
        select: { id: true },
      });
      if (existingPending) {
        throw new Error('You already have a pending verification request');
      }

      if (!user?.cityId) {
        throw new Error('User must have a city set before submitting verification request');
      }

      const verification = await prisma.verificationRequest.create({
        data: {
          userId,
          cityId: user.cityId,
          method: data.method,
          userNote: data.userNote,
          submittedAt: new Date(),
          status: 'PENDING',
          files: {
            create: data.files.map((file) => ({
              storageKey: file.storageKey,
              // Normalize/override mimeType based on trusted storageKey extension
              mimeType: mimeFromStorageKey(file.storageKey),
              bytes: file.bytes,
              role: file.role || VerificationFileRole.DOCUMENT,
            })),
          },
        },
        select: { id: true },
      });

      return { requestId: verification.id };
    },
    {
      actorUserId: userId,
      actorRole: (user?.role as AuditActorRole) || 'USER',
      ...auditContext,
    },
    undefined, // entityId will be filled with verification.id after creation
    'User submitted verification request'
  );
}

/**
 * Get verification request with all files by ID
 * Note: This is a sensitive operation that should be logged when accessing verification documents
 */
export async function getVerificationById(
  requestId: number,
  accessorUserId?: string
): Promise<{
  id: number;
  userId: string;
  status: VerificationStatus;
  method: VerificationMethod;
  cityId: number;
  submittedAt: Date;
  reviewedAt?: Date | null;
  reviewedByUserId?: string | null;
  userNote?: string | null;
  rejectionCode?: string | null;
  rejectionNote?: string | null;
  files: {
    id: number;
    storageKey: string;
    mimeType?: string | null;
    bytes?: number | null;
    role: VerificationFileRole;
    createdAt: Date;
  }[];
} | null> {
  const verification = await prisma.verificationRequest.findUnique({
    where: { id: requestId },
    include: {
      files: {
        select: {
          id: true,
          storageKey: true,
          mimeType: true,
          bytes: true,
          role: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  return verification;
}

/**
 * Add a verification file to an existing request
 */
export async function addVerificationFile(
  requestId: number,
  actorUserId: string,
  fileData: {
    storageKey: string;
    mimeType?: string | null;
    bytes?: number | null;
    role?: VerificationFileRole;
  }
): Promise<{ fileId: number }> {
  const auditContext = await getEnhancedAuditContext();

  return await auditServerAction(
    'VERIFICATION_FILE_UPLOAD' as AuditAction,
    'VERIFICATION_FILE' as AuditEntityType,
    async () => {
      // Verify the request exists and belongs to the user
      const request = await prisma.verificationRequest.findUnique({
        where: { id: requestId },
        select: { userId: true, status: true },
      });

      if (!request) {
        throw new Error('Verification request not found');
      }

      if (request.userId !== actorUserId) {
        throw new Error("Cannot add files to another user's verification request");
      }

      if (request.status !== 'PENDING') {
        throw new Error('Cannot add files to a processed verification request');
      }

      const file = await prisma.verificationFile.create({
        data: {
          verificationId: requestId,
          storageKey: fileData.storageKey,
          mimeType: mimeFromStorageKey(fileData.storageKey),
          bytes: fileData.bytes,
          role: fileData.role || VerificationFileRole.DOCUMENT,
        },
        select: { id: true },
      });

      return { fileId: file.id };
    },
    {
      actorUserId,
      actorRole: 'USER' as AuditActorRole,
      ...auditContext,
    },
    requestId, // Verification request ID as entity
    'User added file to verification request'
  );
}

/**
 * Remove a verification file from a request
 */
export async function removeVerificationFile(
  fileId: number,
  actorUserId: string
): Promise<{ storageKey: string }> {
  const auditContext = await getEnhancedAuditContext();

  return await auditServerAction(
    'VERIFICATION_FILE_DELETE' as AuditAction,
    'VERIFICATION_FILE' as AuditEntityType,
    async () => {
      // Get file with verification request info
      const file = await prisma.verificationFile.findUnique({
        where: { id: fileId },
        include: {
          verification: {
            select: { userId: true, status: true, id: true },
          },
        },
      });

      if (!file) {
        throw new Error('Verification file not found');
      }

      if (file.verification.userId !== actorUserId) {
        throw new Error("Cannot delete files from another user's verification request");
      }

      if (file.verification.status !== 'PENDING') {
        throw new Error('Cannot delete files from a processed verification request');
      }

      await prisma.verificationFile.delete({
        where: { id: fileId },
      });

      return { storageKey: file.storageKey };
    },
    {
      actorUserId,
      actorRole: 'USER' as AuditActorRole,
      ...auditContext,
    },
    fileId, // File ID as entity
    'User removed file from verification request'
  );
}

/**
 * Get user's verification history
 */
export async function getUserVerificationHistory(userId: string): Promise<
  {
    id: number;
    status: VerificationStatus;
    method: VerificationMethod;
    cityId: number;
    submittedAt: Date;
    reviewedAt?: Date | null;
    rejectionCode?: string | null;
    rejectionNote?: string | null;
    filesCount: number;
  }[]
> {
  const requests = await prisma.verificationRequest.findMany({
    where: { userId },
    select: {
      id: true,
      status: true,
      method: true,
      cityId: true,
      submittedAt: true,
      reviewedAt: true,
      rejectionCode: true,
      rejectionNote: true,
      _count: {
        select: { files: true },
      },
    },
    orderBy: { submittedAt: 'desc' },
  });

  return requests.map((req) => ({
    ...req,
    filesCount: req._count.files,
  }));
}

/**
 * Get storage key from verification request (first file)
 */
export async function getVerificationStorageKey(verificationId: number): Promise<string | null> {
  const verification = await prisma.verificationRequest.findUnique({
    where: { id: verificationId },
    include: {
      files: {
        select: { storageKey: true },
        take: 1,
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  return verification?.files[0]?.storageKey || null;
}
