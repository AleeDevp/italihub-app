'use client';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { italianCities } from '@/constants/italianCities';
import { Step2Schema } from '@/lib/schemas/complete-profile-schema';
import { cn } from '@/lib/utils';
import { CheckIcon, ChevronsUpDownIcon } from 'lucide-react';
import Image from 'next/image';
import * as React from 'react';
import { UseFormReturn, useWatch } from 'react-hook-form';
import { z } from 'zod';

interface StepProps {
  form: UseFormReturn<z.infer<typeof Step2Schema> & any>;
  onNext: () => void;
  onBack: () => void;
}

export function Step2Location({ form, onNext, onBack }: StepProps) {
  const [open, setOpen] = React.useState(false);
  const city = useWatch({ control: form.control, name: 'city' });
  const confirmed = useWatch({ control: form.control, name: 'confirmed' });

  const isValid = Step2Schema.safeParse({ city, confirmed }).success;

  const handleNext = async () => {
    const ok = await form.trigger(['city', 'confirmed']);
    if (ok) onNext();
  };

  return (
    <>
      <div className="flex flex-col justify-between h-full p-8">
        <div className="space-y-2 ">
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>City</FormLabel>
                <FormDescription>Select the city you're living in.</FormDescription>

                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      aria-expanded={open}
                      className="w-full justify-between"
                    >
                      {field.value ? field.value : 'Select city'}
                      <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                      <CommandInput placeholder="Search city..." />
                      <CommandEmpty>No city found.</CommandEmpty>
                      <CommandList>
                        <CommandGroup>
                          {italianCities.map((c) => (
                            <CommandItem
                              key={c.id}
                              value={c.name}
                              onSelect={(val) => {
                                field.onChange(val);
                                setOpen(false);
                              }}
                            >
                              <CheckIcon
                                className={cn(
                                  'mr-2 h-4 w-4',
                                  field.value === c ? 'opacity-100' : 'opacity-0'
                                )}
                              />
                              {c.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmed"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 bg-card rounded-md border p-4 ">
                <FormControl>
                  <Checkbox
                    checked={!!field.value}
                    onCheckedChange={(v) => field.onChange(Boolean(v))}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>I confirm the provided information is correct.</FormLabel>
                  {/* <FormDescription>You must confirm to continue.</FormDescription> */}
                </div>
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
      </div>
      <Image
        src="/complete-profile/boy-city.png"
        alt="Girl Greeting"
        width={400}
        height={400}
        priority={true}
        draggable={false}
        className="absolute object-contain h-100 w-auto -bottom-10 left-1/2 transform -translate-x-1/2 -z-50"
      />
    </>
  );
}
