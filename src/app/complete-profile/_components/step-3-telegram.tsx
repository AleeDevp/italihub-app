'use client';

import { Button } from '@/components/ui/button';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Step3Schema } from '@/lib/schemas/complete-profile-schema';
import { AtSignIcon } from 'lucide-react';
import Image from 'next/image';
import { UseFormReturn, useWatch } from 'react-hook-form';
import { z } from 'zod';

interface StepProps {
  form: UseFormReturn<z.infer<typeof Step3Schema> & any>;
  onNext: () => void;
  onBack: () => void;
}

export function Step3Telegram({ form, onNext, onBack }: StepProps) {
  const telegram = useWatch({ control: form.control, name: 'telegram' });
  const isValid = Step3Schema.safeParse({ telegram }).success;

  const handleNext = async () => {
    const ok = await form.trigger(['telegram']);
    if (ok) onNext();
  };

  return (
    <>
      {' '}
      <div className="space-y-4 h-[430px]">
        <FormField
          control={form.control}
          name="telegram"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Telegram ID</FormLabel>
              <FormDescription>Enter your Telegram ID for communication.</FormDescription>
              <FormControl>
                <div className="relative">
                  <Input {...field} placeholder="" className="peer ps-7.5" />

                  <div className="text-muted-foreground pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50">
                    <AtSignIcon size={16} aria-hidden={true} />
                  </div>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <div className="flex justify-between mb-0">
        <Button type="button" variant="secondary" onClick={onBack}>
          Back
        </Button>
        <Button type="button" onClick={handleNext} disabled={!isValid}>
          Next
        </Button>
      </div>
      <Image
        src="/complete-profile/girls-telegram.png"
        alt="Girl Greeting"
        width={400}
        height={400}
        className="absolute bottom-0 left-1/2 transform -translate-x-1/2 -z-50"
      />
    </>
  );
}
