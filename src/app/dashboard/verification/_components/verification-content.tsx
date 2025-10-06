import { User } from '@/lib/auth';
import { getUserVerificationHistory } from '@/lib/dal/verification';
import { VerificationLayout } from './verification-layout';

interface VerificationContentProps {
  user: User;
}

export async function VerificationContent({ user }: VerificationContentProps) {
  const verificationHistory = await getUserVerificationHistory(user.id);

  return <VerificationLayout user={user} verificationHistory={verificationHistory} />;
}
