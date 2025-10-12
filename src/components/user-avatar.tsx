'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { resolveImageUrl } from '@/lib/image_system/image-utils-client';
import { cn } from '@/lib/utils';
import { UserIcon } from 'lucide-react';
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

  return (
    <div className="relative">
      <Avatar className={cn(className)}>
        {url ? <AvatarImage src={url} alt={alt} /> : null}
        <AvatarFallback className="text-muted-foreground">
          <UserIcon className="size-5" />
        </AvatarFallback>
      </Avatar>
      {isVerified ? (
        <span
          aria-label="Verified account"
          className={
            'w-1/3 h-1/3 absolute bg-white rounded-full flex items-center justify-center shrink-0 right-0 bottom-0 shadow-sm'
          }
        >
          <BsCheck className="text-green-600 w-5/6 h-5/6" />
        </span>
      ) : null}
    </div>
  );
}
