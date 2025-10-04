import { getVerificationById, getVerificationStorageKey } from '@/lib/dal/verification';
import { requireUser } from '@/lib/require-user';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  let requestIdParam = 'unknown';
  try {
    // Parse and validate request ID
    const { requestId } = await params;
    requestIdParam = requestId;
    const verificationId = parseInt(requestId);

    if (isNaN(verificationId)) {
      return NextResponse.json({ error: 'Invalid request ID' }, { status: 400 });
    }

    // Authenticate user
    const user = await requireUser();

    // Verify the verification request belongs to the user
    const verification = await getVerificationById(verificationId);
    if (!verification) {
      return NextResponse.json({ error: 'Verification request not found' }, { status: 404 });
    }

    if (verification.userId !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get storage key
    const storageKey = await getVerificationStorageKey(verificationId);
    if (!storageKey) {
      return NextResponse.json({ error: 'No files found for this verification' }, { status: 404 });
    }

    return NextResponse.json({ storageKey });
  } catch (error) {
    console.error('Error fetching verification storage key:', { error, requestId: requestIdParam });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
