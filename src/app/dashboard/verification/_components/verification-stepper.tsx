import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle2, Clock, Send, Shield, UserCheck } from 'lucide-react';

type VerificationStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | null;

interface VerificationStepperProps {
  verificationStatus: VerificationStatus;
  hasSubmittedVerification: boolean;
}

export function VerificationStepper({
  verificationStatus,
  hasSubmittedVerification,
}: VerificationStepperProps) {
  // Determine current step based on verification status
  const getCurrentStep = () => {
    if (!hasSubmittedVerification) return 1;
    if (verificationStatus === 'PENDING') return 2;
    if (verificationStatus === 'APPROVED' || verificationStatus === 'REJECTED') return 3;
    return 1;
  };

  const currentStep = getCurrentStep();

  return (
    <div className="pt-4">
      {/* isolate creates a new stacking context to make z-index layering consistent across browsers */}
      <div className="flex justify-between items-start w-full relative isolate">
        {/* Progress line background */}
        <div
          className="absolute top-6 left-0 right-0 h-1 bg-gray-200 rounded-full z-0 pointer-events-none"
          aria-hidden
        />
        {/* Progress line - first segment */}
        <div
          className={cn(
            'absolute top-6 left-0 h-1 rounded-full z-0 transition-all duration-500 pointer-events-none',
            hasSubmittedVerification ? 'w-1/2 bg-gradient-to-r from-blue-500 to-amber-500' : 'w-0'
          )}
          aria-hidden
        />
        {/* Progress line - second segment */}
        <div
          className={cn(
            'absolute top-6 left-1/2 h-1 rounded-full z-0 transition-all duration-500 pointer-events-none',
            verificationStatus === 'APPROVED'
              ? 'w-1/2 bg-gradient-to-r from-amber-500 to-green-500'
              : verificationStatus === 'REJECTED'
                ? 'w-1/2 bg-gradient-to-r from-amber-500 to-red-500'
                : verificationStatus === 'PENDING'
                  ? 'w-1/2 bg-amber-500'
                  : 'w-0'
          )}
          aria-hidden
        />

        {/* Step 1: Submit */}
        <div className="flex flex-col items-center flex-1 z-10 relative">
          <div
            className={cn(
              'w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg transition-all duration-300 transform relative z-20',
              'bg-gradient-to-br from-blue-500 to-blue-600 ring-4 ring-blue-100',
              hasSubmittedVerification && 'scale-110 shadow-xl'
            )}
          >
            {hasSubmittedVerification ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </div>
          <div className="mt-3 text-center">
            <div
              className={cn(
                'text-sm font-semibold',
                hasSubmittedVerification ? 'text-blue-700' : 'text-blue-600'
              )}
            >
              Submit
            </div>
            <div className="text-xs text-gray-500 mt-1">Upload documents</div>
          </div>
        </div>

        {/* Step 2: Review */}
        <div className="flex flex-col items-center flex-1 z-10 relative">
          <div
            className={cn(
              'w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm shadow-lg  relative z-20',
              verificationStatus === 'PENDING'
                ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white ring-4 ring-amber-100 scale-110 shadow-xl'
                : verificationStatus === 'APPROVED' || verificationStatus === 'REJECTED'
                  ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white ring-4 ring-amber-100 scale-110 shadow-xl'
                  : 'bg-gray-200 text-gray-500 ring-4 ring-gray-100'
            )}
          >
            {verificationStatus === 'PENDING' ? (
              <Clock className="h-5 w-5" />
            ) : verificationStatus === 'APPROVED' || verificationStatus === 'REJECTED' ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : (
              <UserCheck className="h-5 w-5" />
            )}
          </div>
          <div className="mt-3 text-center">
            <div
              className={cn(
                'text-sm font-semibold',
                verificationStatus === 'PENDING'
                  ? 'text-amber-700'
                  : verificationStatus === 'APPROVED' || verificationStatus === 'REJECTED'
                    ? 'text-amber-700'
                    : 'text-gray-500'
              )}
            >
              Review
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {verificationStatus === 'PENDING' ? 'In progress...' : 'Admin verification'}
            </div>
          </div>
        </div>

        {/* Step 3: Result */}
        <div className="flex flex-col items-center flex-1 z-10 relative">
          <div
            className={cn(
              'w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm shadow-lg transition-all duration-300 transform relative z-20',
              verificationStatus === 'APPROVED'
                ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white ring-4 ring-green-100 scale-110 shadow-xl'
                : verificationStatus === 'REJECTED'
                  ? 'bg-gradient-to-br from-red-500 to-rose-600 text-white ring-4 ring-red-100 scale-110 shadow-xl'
                  : 'bg-gray-200 text-gray-500 ring-4 ring-gray-100'
            )}
          >
            {verificationStatus === 'APPROVED' ? (
              <CheckCircle2 className="h-6 w-6" />
            ) : verificationStatus === 'REJECTED' ? (
              <AlertCircle className="h-6 w-6" />
            ) : (
              <Shield className="h-5 w-5" />
            )}
          </div>
          <div className="mt-3 text-center">
            <div
              className={cn(
                'text-sm font-semibold',
                verificationStatus === 'APPROVED'
                  ? 'text-green-700'
                  : verificationStatus === 'REJECTED'
                    ? 'text-red-700'
                    : 'text-gray-500'
              )}
            >
              {verificationStatus === 'APPROVED'
                ? 'Verified'
                : verificationStatus === 'REJECTED'
                  ? 'Rejected'
                  : 'Result'}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {verificationStatus === 'APPROVED'
                ? 'Account verified'
                : verificationStatus === 'REJECTED'
                  ? 'Needs resubmission'
                  : 'Awaiting result'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
