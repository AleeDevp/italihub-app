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
import { useUserIdAvailability } from '@/hooks/use-userid-availability';
import { Step1Schema } from '@/lib/schemas/complete-profile-schema';
import { cn } from '@/lib/utils';
import { AtSignIcon, CheckIcon, LoaderIcon, XIcon } from 'lucide-react';
import Image from 'next/image';
import { useEffect } from 'react';
import { UseFormReturn, useWatch } from 'react-hook-form';
import { z } from 'zod';

interface StepProps {
  form: UseFormReturn<z.infer<typeof Step1Schema> & any>;
  onNext: () => void;
}

export function Step1Basic({ form, onNext }: StepProps) {
  const [name, userId] = useWatch({ control: form.control, name: ['name', 'userId'] });
  const { status, message, check } = useUserIdAvailability();

  // Check availability when userId changes
  useEffect(() => {
    if (userId) {
      check(userId);
    }
  }, [userId, check]);

  // Determine if form is valid (Zod validation + availability check)
  const zodValid = Step1Schema.safeParse({ name, userId }).success;
  const userIdAvailable = status === 'available';
  const isValid = zodValid && userIdAvailable;

  const handleNext = async () => {
    const ok = await form.trigger(['name', 'userId']);
    if (ok && userIdAvailable) {
      onNext();
    }
  };

  return (
    <>
      <div className="flex flex-col justify-between h-full p-8">
        <div className="space-y-6 ">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>

                <FormControl>
                  <Input {...field} placeholder="your name" className="bg-card" />
                </FormControl>
                {/* <FormDescription>This is your public display name.</FormDescription> */}
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="userId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Italihub ID</FormLabel>
                <FormDescription>Choose a unique userId.</FormDescription>
                <FormControl>
                  <div className="relative">
                    <Input
                      {...field}
                      placeholder="userId"
                      className={cn(
                        'peer ps-7.5 pr-10 bg-card',
                        status === 'available' && 'border-green-500 focus:border-green-500',
                        (status === 'taken' || status === 'reserved' || status === 'invalid') &&
                          'border-red-500 focus:border-red-500'
                      )}
                    />
                    <div className="text-muted-foreground pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50">
                      <AtSignIcon size={16} aria-hidden={true} />
                    </div>
                    {/* Status icon */}
                    <div className="pointer-events-none absolute inset-y-0 end-0 flex items-center justify-center pe-3">
                      {status === 'checking' && (
                        <LoaderIcon size={16} className="animate-spin text-gray-500" />
                      )}
                      {status === 'available' && <CheckIcon size={16} className="text-green-500" />}
                      {(status === 'taken' ||
                        status === 'reserved' ||
                        status === 'invalid' ||
                        status === 'error') && <XIcon size={16} className="text-red-500" />}
                    </div>
                  </div>
                </FormControl>

                <FormMessage />

                {/* Availability status message */}
                <div className="text-center -mt-1.5">
                  {/* {status === "available" || status === "checking" || status === "taken" || status === "reserved" || status === "invalid" || status === "error" && (
                          <p className="text-sm mt-1 text-green-600">Great! This userId is available ✓</p>
                        )} */}
                  {message && (
                    <p
                      className={cn(
                        'text-sm mt-1',
                        status === 'available' && 'text-green-600',
                        status === 'checking' && 'text-gray-500',
                        (status === 'taken' || status === 'reserved') && 'text-red-600',
                        (status === 'invalid' || status === 'error') && 'text-red-600 hidden'
                      )}
                    >
                      {message}
                    </p>
                  )}
                </div>
              </FormItem>
            )}
          />
        </div>
        <div className="flex justify-end mb-0">
          <Button type="button" onClick={handleNext} disabled={!isValid}>
            Next
          </Button>
        </div>
      </div>
      <div>
        <Image
          src="/complete-profile/girl-greeting.png"
          alt="Girl Greeting"
          width={400}
          height={400}
          priority={true}
          draggable={false}
          className="absolute object-contain h-100 w-auto -bottom-19 left-1/2 transform -translate-x-1/2 -z-50"
        />
      </div>
    </>
  );
}
