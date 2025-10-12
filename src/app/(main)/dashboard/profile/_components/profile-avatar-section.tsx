'use client';

import { Button } from '@/components/ui/button';
import {
  Cropper,
  CropperCropArea,
  CropperDescription,
  CropperImage,
} from '@/components/ui/cropper';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { UserAvatar } from '@/components/user-avatar';
import { updateProfilePictureAction } from '@/lib/actions/update-profile-picture';
import {
  cropImageToBlob,
  validateImageFile,
  type CropArea,
} from '@/lib/image_system/image-utils-client';
import { Edit } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React from 'react';
import { toast } from 'sonner';

interface ProfileAvatarSectionProps {
  userId: string;
  isVerified: boolean;
  userName: string;
  currentImageKey?: string | null;
}

export function ProfileAvatarSection({
  userId,
  isVerified,
  userName,
  currentImageKey,
}: ProfileAvatarSectionProps) {
  // State management
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [showCropper, setShowCropper] = React.useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = React.useState<string | null>(null);
  const [optimisticImageKey, setOptimisticImageKey] = React.useState(currentImageKey);

  // Refs and hooks
  const cropAreaRef = React.useRef<CropArea | null>(null);
  const router = useRouter();

  // Handlers
  const handleChangePhotoClick = React.useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png,image/webp,image/avif';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const validation = validateImageFile(file, 'avatar');
      if (!validation.success) {
        toast.error(validation.error);
        return;
      }

      const url = URL.createObjectURL(file);
      setSelectedImageUrl(url);
      setShowCropper(true);
    };
    input.click();
  }, []);

  const handleCropConfirm = React.useCallback(async () => {
    const area = cropAreaRef.current;
    if (!selectedImageUrl || !area) return;

    try {
      setIsUpdating(true);

      // Crop image using utility function
      const cropped = await cropImageToBlob(selectedImageUrl, area, 256, 256);
      if (!cropped) {
        toast.error('Failed to crop image');
        return;
      }

      // Create form data and submit
      const file = new File([cropped.blob], 'avatar.png', { type: cropped.blob.type });
      const formData = new FormData();
      formData.set('profilePic', file);

      const result = await updateProfilePictureAction(formData);

      if (!result.ok) {
        toast.error(result.error || 'Failed to update profile picture');
        return;
      }

      // Success - update UI
      setOptimisticImageKey(result.data.imageKey);
      setShowCropper(false);
      toast.success('Profile picture updated successfully!');
      router.refresh();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to update profile picture');
    } finally {
      setIsUpdating(false);
    }
  }, [selectedImageUrl, router]);

  const handleCropCancel = React.useCallback(() => {
    setShowCropper(false);
    if (selectedImageUrl) {
      URL.revokeObjectURL(selectedImageUrl);
      setSelectedImageUrl(null);
    }
    cropAreaRef.current = null;
  }, [selectedImageUrl]);

  // Cleanup effect
  React.useEffect(() => {
    return () => {
      if (selectedImageUrl) {
        URL.revokeObjectURL(selectedImageUrl);
      }
    };
  }, [selectedImageUrl]);

  return (
    <>
      <div className="relative flex flex-1 flex-col w-full items-center shadow-md rounded-3xl p-4 md:p-6 gap-4 md:self-stretch overflow-hidden border border-white bg-gradient-to-br from-accent-foreground/10 to-background">
        {/* Decorative background glows */}
        <div
          className="pointer-events-none absolute -top-10 -right-10 h-36 w-36 rounded-full bg-pink-200/25"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-pink-200/30"
          aria-hidden="true"
        />

        {/* Label */}
        <label className="self-start text-xs uppercase tracking-wide text-muted-foreground">
          Profile Photo
        </label>

        {/* Avatar with gradient ring */}
        <div className="flex flex-col space-y-4 flex-1 items-center justify-center">
          <div className="group relative">
            <div className="p-1.5 rounded-full bg-gradient-to-tr from-primary/30 via-primary/10 to-transparent">
              <div className="rounded-full bg-background">
                <UserAvatar
                  image={optimisticImageKey}
                  alt={userName}
                  size={256}
                  isVerified={isVerified}
                  className="h-24 w-24 md:h-28 md:w-28 transition-transform duration-300 ease-out group-hover:scale-[1.03]"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col items-center gap-1">
            <Button
              variant="secondary"
              size="sm"
              className="bg-white/60 rounded-full px-4 shadow-sm"
              onClick={handleChangePhotoClick}
              disabled={isUpdating}
            >
              <Edit className="h-4 w-4 mr-2" />
              {isUpdating ? 'Updating...' : 'Change Photo'}
            </Button>
            <p className="text-[11px] text-muted-foreground">PNG or JPG, up to 6MB</p>
            {!optimisticImageKey && (
              <span className="text-[11px] text-yellow-700 dark:text-yellow-400/90">
                No photo yet
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Cropper Dialog */}
      <Dialog open={showCropper} onOpenChange={setShowCropper}>
        <DialogContent className="sm:max-w-xl p-2">
          <DialogHeader>
            <DialogTitle className="text-md font-semibold">Crop your profile picture</DialogTitle>
            <DialogDescription className="sr-only">
              Adjust and confirm the crop area to set your profile picture. Use mouse or touch to
              move and resize the square crop region.
            </DialogDescription>
          </DialogHeader>
          {selectedImageUrl && (
            <Cropper
              className="h-80"
              image={selectedImageUrl}
              aspectRatio={1}
              onCropChange={(a) => {
                const area = a as CropArea | null;
                if (!area) {
                  cropAreaRef.current = null;
                  return;
                }
                const prev = cropAreaRef.current;
                if (
                  prev &&
                  prev.x === area.x &&
                  prev.y === area.y &&
                  prev.width === area.width &&
                  prev.height === area.height
                ) {
                  return;
                }
                cropAreaRef.current = area;
              }}
            >
              <CropperDescription />
              <CropperImage />
              <CropperCropArea className="rounded-full" />
            </Cropper>
          )}
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={handleCropCancel}>
              Cancel
            </Button>
            <Button type="button" onClick={handleCropConfirm} disabled={isUpdating}>
              {isUpdating ? 'Updating...' : 'Done'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
