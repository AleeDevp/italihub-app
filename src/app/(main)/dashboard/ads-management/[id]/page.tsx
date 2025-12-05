import { getAdWithDetails } from '@/data/ads/ads';
import { requireUser } from '@/lib/auth/server';
import { notFound, redirect } from 'next/navigation';
import { AdDetailContent } from './_components/ad-detail-content';

interface AdDetailPageProps {
  params: {
    id: string;
  };
}

export default async function AdDetailPage({ params }: AdDetailPageProps) {
  const user = await requireUser();
  const { id } = await params;
  const adId = parseInt(id, 10);

  if (isNaN(adId)) {
    notFound();
  }

  const ad = await getAdWithDetails(adId);

  if (!ad) {
    notFound();
  }

  // Check if the user owns this ad
  if (ad.userId !== user.id) {
    redirect('/dashboard/ads-management');
  }

  // Serialize Decimal values for client component
  const serializedAd = {
    ...ad,
    ...(ad.category === 'HOUSING' && {
      housing: {
        ...ad.housing,
        priceAmount: ad.housing.priceAmount ? ad.housing.priceAmount.toString() : null,
      },
    }),
    ...(ad.category === 'TRANSPORTATION' && {
      transportation: {
        ...ad.transportation,
        pricePerKg: ad.transportation.pricePerKg ? ad.transportation.pricePerKg.toString() : null,
        fixedTotalPrice: ad.transportation.fixedTotalPrice
          ? ad.transportation.fixedTotalPrice.toString()
          : null,
        capacityKg: ad.transportation.capacityKg ? ad.transportation.capacityKg.toString() : null,
      },
    }),
    ...(ad.category === 'MARKETPLACE' && {
      marketplace: {
        ...ad.marketplace,
        price: ad.marketplace.price.toString(),
      },
    }),
    ...(ad.category === 'SERVICES' && {
      service: {
        ...ad.service,
        rateAmount: ad.service.rateAmount ? ad.service.rateAmount.toString() : null,
      },
    }),
  };

  return <AdDetailContent ad={serializedAd as typeof ad} />;
}
