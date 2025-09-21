'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardDescription } from '@/components/ui/card';
import Image from 'next/image';

export default function HomePage() {
  const categories = [
    {
      image: '/home/housing-2-w-m.png',
      title: 'Housing',
      description: 'Find or offer apartments, rooms, and housing solutions across Italy',
      color: 'from-blue-500/10 to-blue-600/5',
      badge: 'Popular',
    },
    {
      image: '/home/currency.png',
      title: 'Currency Exchange',
      description: 'Exchange EUR-IRR with verified community members',
      color: 'from-yellow-500/10 to-yellow-600/5',
      badge: 'Secure',
    },
    {
      image: '/home/currency.png',
      title: 'Transportation',
      description: 'Send and receive packages between Iran and Italy',
      color: 'from-green-500/10 to-green-600/5',
      badge: 'Trusted',
    },
    {
      image: '/home/market.png',
      title: 'Market',
      description: 'Buy and sell second-hand items ',
      color: 'from-purple-500/10 to-purple-600/5',
      badge: 'Active',
    },
    {
      image: '/home/services.png',
      title: 'Services',
      description: 'Offer or find personal services',
      color: 'from-orange-500/10 to-orange-600/5',
      badge: 'Growing',
    },
  ];

  return (
    <div>
      {/* Categories Section Card */}
      <section className="mx-auto sm:px-10">
        <div className="w-full grid grid-cols-3 auto-rows-[130px] md:auto-rows-[140px] gap-2 sm:gap-4">
          {/* 1) Full-width top card */}
          <CategoryCard
            image={categories[0].image}
            title={categories[0].title}
            description={categories[0].description}
            badge={categories[0].badge}
            color={categories[0].color}
            className="col-span-3 row-span-1"
          />

          {/* 2) Tall card on left spanning two rows */}
          <CategoryCard
            image={categories[1].image}
            title={categories[1].title}
            description={categories[1].description}
            badge={categories[1].badge}
            color={categories[1].color}
            className="col-span-1 row-span-2 "
          />

          {/* 3) Wide card across columns 2-3 on row 2 */}
          <CategoryCard
            image={categories[2].image}
            title={categories[2].title}
            description={categories[2].description}
            badge={categories[2].badge}
            color={categories[2].color}
            className="col-span-2 row-span-1"
          />

          {/* 4) Bottom middle */}
          <CategoryCard
            image={categories[3].image}
            title={categories[3].title}
            description={categories[3].description}
            badge={categories[3].badge}
            color={categories[3].color}
            className="col-span-1 row-span-1"
          />

          {/* 5) Bottom right */}
          <CategoryCard
            image={categories[4].image}
            title={categories[4].title}
            description={categories[4].description}
            badge={categories[4].badge}
            color={categories[4].color}
            className="col-span-1 row-span-1"
          />
        </div>
      </section>
    </div>
  );
}

type CategoryCardProps = {
  image: string;
  title: string;
  description: string;
  badge: string;
  color: string; // tailwind gradient color classes suffix used with bg-gradient-to-r
  className?: string;
};

function CategoryCard({ image, title, description, badge, color, className }: CategoryCardProps) {
  return (
    <Card
      className={`z-10 flex relative group px-4 pb-4 overflow-hidden hover:shadow-3xl transition-shadow duration-500 ${className ?? ''}`}
    >
      {/* Floating Badge */}
      <div className="absolute top-3 right-3">
        <Badge variant="secondary" className="text-xs px-2 py-1">
          {badge}
        </Badge>
      </div>
      <div className="mt-auto">
        <h1 className="font-semibold leading-5 md:text-2xl lg:text-3xl group-hover:text-primary transition-colors">
          {title}
        </h1>

        <div className=" hidden md:block mt-2">
          <CardDescription className=" text-sm md:text-base leading-tight">
            {description}
          </CardDescription>
        </div>
      </div>
      <Image src={image} alt={title} fill className="object-cover object-[50%_65%] -z-10" />
      {/* 50% x-axis, 30% y-axis */}
      {/* White gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-white/100 via-white/30  to-transparent -z-10" />
      {/* Hover Effect Overlay */}
      {/* <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" /> */}
    </Card>
  );
}
