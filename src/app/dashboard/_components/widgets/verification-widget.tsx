import { Widget } from '@/components/dashboard/widget';
import { Shield } from 'lucide-react';

export interface VerificationWidgetProps {
  verified: boolean | null | undefined;
  verificationStatus: string | null; // e.g. PENDING, REJECTED, etc.
}

export function VerificationWidget({ verified, verificationStatus }: VerificationWidgetProps) {
  return (
    <Widget
      title="Verification"
      description={verified ? "You're verified!" : 'Get verified to unlock all features'}
      ctaLabel={verified ? 'View Status' : 'Get Verified'}
      href="/dashboard/verification"
      icon={<Shield className="h-5 w-5" />}
    >
      <div className="space-y-2">
        {verified ? (
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-green-600" />
            <span className="text-sm text-green-600 font-medium">Verified</span>
          </div>
        ) : verificationStatus === 'PENDING' ? (
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded-full bg-yellow-500 animate-pulse" />
            <span className="text-sm text-yellow-600 font-medium">Review in Progress</span>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">
            Complete verification to access currency exchange and other premium features.
          </div>
        )}
      </div>
    </Widget>
  );
}
