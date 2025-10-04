import { getUserVerificationHistory } from '@/lib/dal/verification';
import { VerificationLayout } from './verification-layout';

interface VerificationContentProps {
  userId: string;
  userName?: string;
  cityName?: string;
}

export async function VerificationContent({
  userId,
  userName,
  cityName,
}: VerificationContentProps) {
  const verificationHistory = await getUserVerificationHistory(userId);

  return (
    <VerificationLayout
      userId={userId}
      userName={userName}
      cityName={cityName}
      verificationHistory={verificationHistory}
    />
  );
}
