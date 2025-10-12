import { getUserVerificationHistory } from '@/data/user/verification.dal';
import type { User } from '@/lib/auth/client';
import { VerificationLayout } from './verification-layout';

interface VerificationContentProps {
  user: User;
}

export async function VerificationContent({ user }: VerificationContentProps) {
  const verificationHistory = await getUserVerificationHistory(user.id);

  return <VerificationLayout user={user} verificationHistory={verificationHistory} />;
}
