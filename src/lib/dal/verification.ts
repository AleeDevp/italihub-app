import type { VerificationMethod, VerificationStatus } from '@/generated/prisma';
import { prisma } from '@/lib/db';

export async function getLatestVerification(userId: string): Promise<{
  id: number;
  status: VerificationStatus;
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
      role?: 'DOCUMENT' | 'SELFIE' | 'OTHER';
    }[];
  }
): Promise<{ requestId: number }> {
  // Check if user already has a pending verification
  const existingPending = await prisma.verificationRequest.findFirst({
    where: {
      userId,
      status: 'PENDING',
    },
    select: { id: true },
  });

  if (existingPending) {
    throw new Error('You already have a pending verification request');
  }

  // Get user's current city
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { cityId: true },
  });

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
          mimeType: file.mimeType,
          bytes: file.bytes,
          role: file.role || 'DOCUMENT',
        })),
      },
    },
  });

  return { requestId: verification.id };
}
