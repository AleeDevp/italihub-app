'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { resolveImageUrl } from '@/lib/image-utils-client';
import { cn } from '@/lib/utils';
import { UserIcon } from 'lucide-react';
import { BiSolidBadge } from 'react-icons/bi';
import { BsCheck } from 'react-icons/bs';

type UserAvatarProps = {
  image?: string | null;
  alt?: string;
  className?: string;
  size?: number; // optional width hint for Cloudinary transform
  isVerified: boolean; // show verified badge on top-right if true
};

export function UserAvatar({
  image,
  alt = 'User avatar',
  className,
  size = 96,
  isVerified = false,
}: UserAvatarProps) {
  const url = resolveImageUrl(image, { width: size, crop: 'fill', gravity: 'face' });

  // simple size mapping for the badge based on the provided width hint
  const iconSizeClass = size / 5.5;
  const checkSize = Math.round(iconSizeClass * 0.7);

  return (
    <span className={cn('relative')}>
      <Avatar className={cn('h-10 w-10 ', className)}>
        {url ? <AvatarImage src={url} alt={alt} /> : null}
        <AvatarFallback className="text-muted-foreground">
          <UserIcon className="size-5" />
        </AvatarFallback>
      </Avatar>
      {isVerified ? (
        <span aria-label="Verified account" className={cn('absolute -right-1 -bottom-1')}>
          <span className="relative inline-block">
            <BiSolidBadge
              size={iconSizeClass}
              className="text-green-600"
              stroke="#b9f8cf"
              strokeWidth={2}
            />
            <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <BsCheck size={checkSize} className="text-green-200" />
            </span>
          </span>
        </span>
      ) : null}
    </span>
  );
}
