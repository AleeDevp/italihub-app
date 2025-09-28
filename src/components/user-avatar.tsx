'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { resolveImageUrl } from '@/lib/image-utils-client';
import { cn } from '@/lib/utils';
import { UserIcon } from 'lucide-react';

type UserAvatarProps = {
  image?: string | null;
  alt?: string;
  className?: string;
  size?: number; // optional width hint for Cloudinary transform
};

export function UserAvatar({ image, alt = 'User avatar', className, size = 96 }: UserAvatarProps) {
  const url = resolveImageUrl(image, { width: size, crop: 'fill', gravity: 'face' });

  return (
    <Avatar className={cn('h-10 w-10', className)}>
      {url ? <AvatarImage src={url} alt={alt} /> : null}
      <AvatarFallback className="text-muted-foreground">
        <UserIcon className="size-5" />
      </AvatarFallback>
    </Avatar>
  );
}
