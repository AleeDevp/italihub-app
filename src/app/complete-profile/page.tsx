'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { StepTransition } from '@/components/transitions/step-transition';
import {
  Stepper,
  StepperIndicator,
  StepperItem,
  StepperSeparator,
  StepperTrigger,
} from '@/components/ui/stepper';
import { completeProfileAction } from '@/lib/actions/complete-profile';
import { useSession } from '@/lib/auth-client';
import { CompleteProfileSchema } from '@/lib/schemas/complete-profile-schema';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import * as z from 'zod';
import { Step1Basic } from './_components/step-1-basic';
import { Step2Location } from './_components/step-2-location';
import { Step3Telegram } from './_components/step-3-telegram';
import { Step4Avatar } from './_components/step-4-avatar';
import { SubmissionStatusCard } from './_components/submission-status-card';

export default function CompleteProfilePage() {
  const { data, refetch } = useSession();
  const steps = [1, 2, 3, 4];
  const [currentStep, setCurrentStep] = useState(1);
  const [prevStep, setPrevStep] = useState(1);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorText, setErrorText] = useState<string | undefined>(undefined);
  const router = useRouter();

  const form = useForm<z.infer<typeof CompleteProfileSchema>>({
    resolver: zodResolver(CompleteProfileSchema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      userId: '',
      city: '',
      confirmed: false,
      telegram: '',
      profilePic: null,
    },
  });

  // Prefill from session
  useEffect(() => {
    if (data?.user?.name) {
      form.setValue('name', data.user.name || '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.user?.name]);

  const next = useCallback(() => {
    setPrevStep(currentStep);
    setCurrentStep((s) => Math.min(s + 1, steps.length));
  }, [currentStep, steps.length]);

  const back = useCallback(() => {
    setPrevStep(currentStep);
    setCurrentStep((s) => Math.max(s - 1, 1));
  }, [currentStep]);

  const onSubmit = useCallback(async (values: z.infer<typeof CompleteProfileSchema>) => {
    setStatus('loading');
    setErrorText(undefined);
    try {
      const fd = new FormData();
      fd.set('name', values.name);
      fd.set('userId', values.userId);
      fd.set('city', values.city);
      fd.set('confirmed', String(values.confirmed));
      fd.set('telegram', values.telegram || '');
      if (values.profilePic instanceof File) {
        fd.set('profilePic', values.profilePic);
      }

      const result = await completeProfileAction(fd);
      if (!result.ok) {
        setErrorText(result.error || 'Failed to submit profile');
        setStatus('error');
        return;
      }
      refetch(); // Update session with new user data
      setStatus('success');
    } catch (e: any) {
      setErrorText(e?.message || 'Unexpected error');
      setStatus('error');
    }
  }, []);

  const handleRetry = useCallback(() => {
    setStatus('idle');
    setErrorText(undefined);
    // Stay on last step so user can re-submit
    setCurrentStep(4);
  }, []);

  const handleBackHome = useCallback(() => {
    router.push('/');
  }, [router]);

  const renderStep = useMemo(() => {
    switch (currentStep) {
      case 1:
        return <Step1Basic form={form as any} onNext={next} />;
      case 2:
        return <Step2Location form={form as any} onBack={back} onNext={next} />;
      case 3:
        return <Step3Telegram form={form as any} onBack={back} onNext={next} />;
      case 4:
        return (
          <Step4Avatar form={form as any} onBack={back} onSubmit={form.handleSubmit(onSubmit)} />
        );
      default:
        return null;
    }
  }, [currentStep, back, form, next, onSubmit]);

  return (
    <div className="flex items-center justify-center min-h-screen py-4">
      {status !== 'idle' ? (
        <SubmissionStatusCard
          status={status}
          errorText={errorText}
          onRetry={status === 'error' ? handleRetry : undefined}
          onBackHome={status === 'error' ? handleBackHome : undefined}
          onGoDashboard={status === 'success' ? () => router.push('/dashboard') : undefined}
        />
      ) : (
        <div className="w-full max-w-md space-y-10">
          <div className="flex flex-col items-center justify-center space-y-6">
            <h1 className="text-2xl font-bold text-center">Complete Your Profile</h1>
            <div className="w-3/4 justify-center">
              <Stepper value={currentStep} onValueChange={setCurrentStep}>
                {steps.map((step) => (
                  <StepperItem key={step} step={step} className="not-last:flex-1">
                    <StepperTrigger asChild>
                      <StepperIndicator />
                    </StepperTrigger>
                    {step < steps.length && <StepperSeparator />}
                  </StepperItem>
                ))}
              </Stepper>
            </div>
          </div>
          <Card className="relative bg-card overflow-hidden z-50 p-0 h-[550px]">
            <CardContent className="space-y-6 h-full p-0">
              <Form {...form}>
                {/* Keep RHF root form; Step components call trigger and setValue as needed */}
                <form className="space-y-4 h-full" onSubmit={form.handleSubmit(onSubmit)}>
                  <StepTransition
                    currentStep={currentStep}
                    direction={currentStep > prevStep ? 'forward' : 'backward'}
                  >
                    {renderStep}
                  </StepTransition>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
