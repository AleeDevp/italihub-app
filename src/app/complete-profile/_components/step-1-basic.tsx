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
import { Step1Schema } from '@/lib/schemas/complete-profile-schema';
import { AtSignIcon } from 'lucide-react';
import Image from 'next/image';
import { UseFormReturn, useWatch } from 'react-hook-form';
import { z } from 'zod';

interface StepProps {
  form: UseFormReturn<z.infer<typeof Step1Schema> & any>;
  onNext: () => void;
}

export function Step1Basic({ form, onNext }: StepProps) {
  const [name, username] = useWatch({ control: form.control, name: ['name', 'username'] });
  const isValid = Step1Schema.safeParse({ name, username }).success;

  const handleNext = async () => {
    const ok = await form.trigger(['name', 'username']);
    if (ok) onNext();
  };

  return (
    <>
      <div className="space-y-6 h-[460px]">
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
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Italihub ID</FormLabel>
              <FormDescription>Choose a unique username.</FormDescription>
              <FormControl>
                <div className="relative">
                  <Input {...field} placeholder="username" className="peer ps-7.5 bg-card" />
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
      <div className="flex justify-end mb-0">
        <Button type="button" onClick={handleNext} disabled={!isValid}>
          Next
        </Button>
      </div>
      <div>
        <Image
          src="/complete-profile/girl-greeting.png"
          alt="Girl Greeting"
          width={290}
          height={300}
          className="absolute -bottom-19 left-1/2 transform -translate-x-1/2 -z-50"
        />
      </div>
    </>
  );
}
