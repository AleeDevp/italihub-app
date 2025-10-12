'use client';

import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';
import { useState } from 'react';
import { HousingForm } from './housing-form';
import { MarketForm } from './market-form';
import { ServicesForm } from './services-form';
import { TransportationForm } from './transportation-form';

export type AdCategory = 'housing' | 'transportation' | 'market' | 'services';

const categories = [
  {
    id: 'housing' as AdCategory,
    name: 'Housing',
    imageSrc: '/ads/housing.png',
  },
  {
    id: 'transportation' as AdCategory,
    name: 'Transportation',
    imageSrc: '/ads/transportation.png',
  },
  {
    id: 'market' as AdCategory,
    name: 'Market',
    imageSrc: '/ads/market.png',
  },
  {
    id: 'services' as AdCategory,
    name: 'Services',
    imageSrc: '/ads/services.png',
  },
];

export function CreateAdContent() {
  const [selectedCategory, setSelectedCategory] = useState<AdCategory>('housing');

  const renderForm = () => {
    switch (selectedCategory) {
      case 'housing':
        return <HousingForm />;
      case 'transportation':
        return <TransportationForm />;
      case 'market':
        return <MarketForm />;
      case 'services':
        return <ServicesForm />;
    }
  };

  return (
    <div className="bg-background pt-6 p-3 rounded-3xl border-1 shadow-sm space-y-4">
      {/* Header and helper copy */}
      <div className="text-center mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">Select your category</h2>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          Choose what type of ad you want to create.
        </p>
      </div>

      {/* Category Selection */}
      <div className="flex justify-center w-full mt-16">
        <div className="w-full mx-auto h-[78px] md:h-[92px] lg:h-[105px] ">
          <div className="grid grid-cols-4 h-full gap-1 md:gap-3 lg:gap-6 items-stretch">
            {categories.map((category) => {
              const isActive = selectedCategory === category.id;

              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={cn(
                    'relative',
                    'w-full h-full',
                    'rounded-2xl md:rounded-3xl lg:rounded-4xl  transition-all duration-200',
                    'border border-dashed border-muted',
                    'transition-all duration-200',

                    isActive ? 'bg-white border-solid border-primary' : 'grayscale'
                  )}
                >
                  {/* Content */}
                  <div className="flex flex-col h-full items-center justify-center py-3.5">
                    {/* Icon - No circle background, just the icon */}
                    <div className="">
                      <Image
                        src={category.imageSrc}
                        alt={category.name}
                        width={500}
                        height={500}
                        loading="lazy"
                        className={cn(
                          'absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-[80%]',
                          'transition-all duration-200 drop-shadow-sm object-contain',
                          'select-none pointer-events-none',
                          isActive
                            ? 'w-24 h-24 md:w-30 md:h-30 lg:w-44 lg:h-44 drop-shadow-md'
                            : 'w-20 h-20 md:w-26 md:h-26 lg:w-37 lg:h-37'
                        )}
                      />
                    </div>
                    <div className="h-full flex flex-col items-center justify-end overflow-hidden">
                      {/* Label */}
                      <span
                        className={cn(
                          'text-[10px] md:text-xs lg:text-base font-medium line-clamp-1 transition-all duration-200 text-center leading-tight',
                          isActive ? 'text-foreground' : 'text-muted-foreground'
                        )}
                      >
                        {category.name}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <Separator />

      {/* Form Content with Simple Fade Animation */}
      <div className="relative min-h-[600px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedCategory}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="w-full"
          >
            {renderForm()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
