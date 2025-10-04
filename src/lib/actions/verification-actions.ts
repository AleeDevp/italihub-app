'use server';

import type { VerificationFileRole, VerificationMethod } from '@/generated/prisma';
import { auditServerAction } from '@/lib/audit';
import {
  addVerificationFile,
  getUserVerificationHistory,
  removeVerificationFile,
  submitVerificationRequest,
} from '@/lib/dal/verification';
import { Enum } from '@/lib/enums';
import { ImageService } from '@/lib/image-utils-server';
import { requireUser } from '@/lib/require-user';

export type UploadVerificationFileResult =
  | { ok: true; data: { fileId: number; storageKey: string } }
  | { ok: false; error: string };

export type SubmitVerificationRequestResult =
  | { ok: true; data: { requestId: number } }
  | { ok: false; error: string };

/**
 * Upload a single verification file
 */
export async function uploadVerificationFileAction(
  formData: FormData,
  requestId?: number
): Promise<UploadVerificationFileResult> {
  // Step 1: Authenticate user
  const user = await requireUser();

  return await auditServerAction(
    'VERIFICATION_FILE_UPLOAD',
    'VERIFICATION_FILE',
    async () => {
      // Step 2: Extract and validate file
      const file = formData.get('verificationFile') as File;
      if (!file || typeof file.arrayBuffer !== 'function') {
        return { ok: false, error: 'No valid file provided' };
      }

      const role =
        (formData.get('role') as VerificationFileRole) || Enum.VerificationFileRole.DOCUMENT;

      // Step 3: Upload using unified image service with 'verification' type
      const uploadResult = await ImageService.uploadImage(file, user.id, 'verification');

      if (!uploadResult.success) {
        return { ok: false, error: uploadResult.error };
      }

      // Step 4: Add file to verification request (if requestId provided)
      if (requestId) {
        try {
          const fileResult = await addVerificationFile(requestId, user.id, {
            storageKey: uploadResult.data.storageKey,
            mimeType: uploadResult.data.format,
            bytes: uploadResult.data.bytes,
            role: role,
          });

          return {
            ok: true,
            data: {
              fileId: fileResult.fileId,
              storageKey: uploadResult.data.storageKey,
            },
          };
        } catch (error) {
          // Step 4.1: Rollback - delete uploaded file if database operation fails
          await ImageService.deleteImage(uploadResult.data.storageKey);
          return {
            ok: false,
            error:
              error instanceof Error ? error.message : 'Failed to add file to verification request',
          };
        }
      }

      // Step 5: Return file info for temporary storage (to be used in form submission)
      return {
        ok: true,
        data: {
          fileId: 0, // Temporary - will be assigned when request is submitted
          storageKey: uploadResult.data.storageKey,
        },
      };
    },
    {
      actorUserId: user.id,
      actorRole: 'USER',
    },
    requestId,
    'Verification file upload action'
  );
}

/**
 * Submit complete verification request with files
 */
export async function submitVerificationRequestAction(data: {
  method: VerificationMethod;
  userNote?: string;
  files: {
    storageKey: string;
    role?: VerificationFileRole;
  }[];
}): Promise<SubmitVerificationRequestResult> {
  try {
    // Step 1: Authenticate user
    const user = await requireUser();

    // Step 2: Validate input
    if (!data.method) {
      return { ok: false, error: 'Verification method is required' };
    }

    if (!data.files || data.files.length === 0) {
      return { ok: false, error: 'At least one verification file is required' };
    }

    // Step 3: Check if user already has pending verification
    const verificationHistory = await getUserVerificationHistory(user.id);
    const hasPendingVerification = verificationHistory.some((v) => v.status === 'PENDING');
    if (hasPendingVerification) {
      return { ok: false, error: 'You already have a pending verification request' };
    }

    // Step 4: Submit verification request with files
    const result = await submitVerificationRequest(user.id, {
      method: data.method,
      userNote: data.userNote,
      files: data.files.map((file) => ({
        storageKey: file.storageKey,
        role: file.role || Enum.VerificationFileRole.DOCUMENT,
      })),
    });

    return {
      ok: true,
      data: {
        requestId: result.requestId,
      },
    };
  } catch (error: any) {
    console.error('Verification request submission error:', {
      error: error?.message,
      stack: error?.stack,
      method: data.method,
      filesCount: data.files?.length || 0,
    });

    // Clean up uploaded files on failure
    if (data.files) {
      for (const file of data.files) {
        try {
          await ImageService.deleteImage(file.storageKey);
        } catch (cleanupError) {
          console.error('Failed to cleanup file:', file.storageKey, cleanupError);
        }
      }
    }

    // Provide user-friendly error messages
    let userMessage = 'Failed to submit verification request. Please try again.';

    if (error?.message?.includes('VerificationFileRole')) {
      userMessage = 'There was an issue with your file upload. Please try uploading again.';
    } else if (
      error?.message?.includes('duplicate key') ||
      error?.message?.includes('already exists')
    ) {
      userMessage = 'You already have a pending verification request.';
    } else if (error?.message?.includes('connection') || error?.message?.includes('timeout')) {
      userMessage = 'Connection error. Please check your internet and try again.';
    } else if (error?.message?.includes('file') || error?.message?.includes('upload')) {
      userMessage = 'File upload failed. Please try uploading your image again.';
    }

    return {
      ok: false,
      error: userMessage,
    };
  }
}

/**
 * Remove a verification file
 */
export async function removeVerificationFileAction(
  fileId: number
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    // Step 1: Authenticate user
    const user = await requireUser();

    // Step 2: Remove file from database and get storage key
    const result = await removeVerificationFile(fileId, user.id);

    // Step 3: Delete from storage
    await ImageService.deleteImage(result.storageKey);

    return { ok: true };
  } catch (error: any) {
    console.error('Verification file removal error:', {
      error: error?.message,
      fileId,
    });

    return {
      ok: false,
      error: error?.message || 'Failed to remove file. Please try again.',
    };
  }
}
