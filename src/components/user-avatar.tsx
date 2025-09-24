'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { UserIcon } from 'lucide-react';

type UserAvatarProps = {
  image?: string | null;
  alt?: string;
  className?: string;
  size?: number; // optional width hint for Cloudinary transform
};

export function UserAvatar({ image, alt = 'User avatar', className, size = 96 }: UserAvatarProps) {
  const url = resolveImageUrl(image, size);

  return (
    <Avatar className={cn('h-10 w-10', className)}>
      {url ? <AvatarImage src={url} alt={alt} /> : null}
      <AvatarFallback className="text-muted-foreground">
        <UserIcon className="size-5" />
      </AvatarFallback>
    </Avatar>
  );
}

function resolveImageUrl(image?: string | null, size?: number): string | null {
  if (!image || image.trim() === '') return null;
  // If it's already a full URL, a public asset path (/...), or a blob, use as-is
  if (/^(https?:\/\/|\/|blob:)/.test(image)) return image;

  // Otherwise, treat as a Cloudinary storage key and build a delivery URL
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  if (!cloud) return null;
  const base = `https://res.cloudinary.com/${cloud}/image/upload`;
  // dpr_auto for HiDPI, fl_strip_profile strips EXIF/ICC metadata, f_auto/q_auto for optimal delivery
  const t = `dpr_auto,f_auto,q_auto,fl_strip_profile${size ? `,w_${size}` : ''}`;
  return `${base}/${t}/${image}`;
}
