import type { ImageType } from '@/lib/image_system/image-utils-client';
import { getOptimizedUrl } from '@/lib/image_system/image-utils-client';
import { memo, useMemo } from 'react';

interface OptimizedImageProps {
  storageKey: string;
  imageType: ImageType;
  alt: string;
  className?: string;
  fallbackIcon?: React.ReactNode;
}

export const OptimizedImage = memo(function OptimizedImage({
  storageKey,
  imageType,
  alt,
  className,
  fallbackIcon,
}: OptimizedImageProps) {
  // Get optimized URL with type-specific transformations - memoized to prevent refetching
  const optimizedUrl = useMemo(
    () => getOptimizedUrl(storageKey, imageType),
    [storageKey, imageType]
  );

  if (!optimizedUrl) {
    return (
      <div className={`bg-gray-200 flex items-center justify-center ${className || ''}`}>
        {fallbackIcon || <span className="text-gray-400">No Image</span>}
      </div>
    );
  }

  return <img src={optimizedUrl} alt={alt} className={className} loading="lazy" />;
});
