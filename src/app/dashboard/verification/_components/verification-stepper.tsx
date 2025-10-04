import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle2, Clock, Send, Shield, UserCheck } from 'lucide-react';

type VerificationStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | null;

interface VerificationStepperProps {
  verificationStatus: VerificationStatus;
}

export function VerificationStepper({ verificationStatus }: VerificationStepperProps) {
  const isSubmitted = verificationStatus !== null;
  const isPending = verificationStatus === 'PENDING';
  const isResult = verificationStatus === 'APPROVED' || verificationStatus === 'REJECTED';
  const resultColor = verificationStatus === 'APPROVED' ? 'bg-green-500' : 'bg-red-500';

  return (
    <div className="pt-4">
      {/* Using per-step connectors ensures precise segment colors */}
      <div className="flex items-start w-full relative">
        {/* Step 1: Submit */}
        <div className="flex flex-col items-center flex-1 relative">
          {/* Left connector (left of Submit) - always blue since Submit is enabled */}
          <div
            className={cn('absolute top-6 left-0 right-1/2 h-1 rounded-full', 'bg-blue-500')}
            aria-hidden
          />
          {/* Right connector (between Submit and Review) */}
          <div
            className={cn(
              'absolute top-6 left-1/2 right-0 h-1',
              isPending || isResult ? 'bg-amber-500' : 'bg-gray-200'
            )}
            aria-hidden
          />
          <div
            className={cn(
              'w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg transition-all duration-300 transform relative z-20',
              'bg-gradient-to-br from-blue-500 to-blue-600 ring-4 ring-blue-100',
              isSubmitted && 'scale-110 shadow-xl'
            )}
          >
            {isSubmitted ? <CheckCircle2 className="h-5 w-5" /> : <Send className="h-5 w-5" />}
          </div>
          <div className="mt-3 text-center">
            <div
              className={cn(
                'text-sm font-semibold',
                isSubmitted ? 'text-blue-700' : 'text-blue-600'
              )}
            >
              Submit
            </div>
            <div className="text-xs text-gray-500 mt-1">Upload documents</div>
          </div>
        </div>

        {/* Step 2: Review */}
        <div className="flex flex-col items-center flex-1 relative">
          {/* Left connector (between Submit and Review) */}
          <div
            className={cn(
              'absolute top-6 left-0 right-1/2 h-1',
              isPending || isResult ? 'bg-amber-500' : 'bg-gray-200'
            )}
            aria-hidden
          />
          {/* Right connector (between Review and Result) */}
          <div
            className={cn(
              'absolute top-6 left-1/2 right-0 h-1',
              isResult ? resultColor : 'bg-gray-200'
            )}
            aria-hidden
          />
          <div
            className={cn(
              'w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm shadow-lg  relative z-20',
              isPending || isResult
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
                isPending || isResult ? 'text-amber-700' : 'text-gray-500'
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
        <div className="flex flex-col items-center flex-1 relative">
          {/* Left connector (between Review and Result) */}
          <div
            className={cn(
              'absolute top-6 left-0 right-1/2 h-1 ',
              isResult ? resultColor : 'bg-gray-200'
            )}
            aria-hidden
          />
          {/* Right connector (after Result) */}
          <div
            className={cn(
              'absolute top-6 left-1/2 right-0 h-1 rounded-full',
              isResult ? resultColor : 'bg-gray-200'
            )}
            aria-hidden
          />
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
