'use client';

import AvatarUploadDroppable from '@/components/avatar-upload-droppable';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Step4Schema } from '@/lib/schemas/complete-profile-schema';
import * as React from 'react';
import { UseFormReturn, useWatch } from 'react-hook-form';
import { z } from 'zod';

import Img from 'next/image';

type Area = { x: number; y: number; width: number; height: number };

interface StepProps {
  form: UseFormReturn<z.infer<typeof Step4Schema> & any>;
  onBack: () => void;
  onSubmit: () => void;
}

export function Step4Avatar({ form, onBack, onSubmit }: StepProps) {
  const file = useWatch({ control: form.control, name: 'profilePic' });
  const [open, setOpen] = React.useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = React.useState<string | null>(null);
  const cropAreaRef = React.useRef<Area | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);

  // Only show preview for the confirmed/cropped file stored in the form
  React.useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    if (file instanceof File) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    if (typeof file === 'string') {
      setPreviewUrl(file);
    }
  }, [file]);

  const isValid = Step4Schema.safeParse({ profilePic: file }).success;

  const handleFilesAdded = React.useCallback((added: { file: File }[]) => {
    const f = added[0]?.file;
    if (!f) return;
    const url = URL.createObjectURL(f);
    setSelectedImageUrl(url);
    setOpen(true);
  }, []);

  const handleRemoveImage = React.useCallback(() => {
    form.setValue('profilePic', null, { shouldValidate: true, shouldDirty: true });
    setPreviewUrl(null);
  }, [form]);

  const onCropConfirm = React.useCallback(async () => {
    const area = cropAreaRef.current;
    if (!selectedImageUrl || !area) return;
    const cropped = await cropImageToBlob(selectedImageUrl, area, 256, 256);
    if (cropped) {
      const file = new File([cropped.blob], 'avatar.png', { type: cropped.blob.type });
      form.setValue('profilePic', file, { shouldValidate: true, shouldDirty: true });
      setPreviewUrl(cropped.url);
    }
    setOpen(false);
  }, [selectedImageUrl, form]);

  // Revoke selected image URL when it changes or component unmounts
  React.useEffect(() => {
    return () => {
      if (selectedImageUrl) URL.revokeObjectURL(selectedImageUrl);
    };
  }, [selectedImageUrl]);

  // Reset cropper state when dialog closes
  React.useEffect(() => {
    if (!open) {
      cropAreaRef.current = null;
      // Clear selected image and ensure no preview is shown unless a file is confirmed in form
      setSelectedImageUrl(null);
    }
  }, [open]);

  return (
    <>
      <div className="space-y-4 h-[450px]">
        <FormField
          control={form.control}
          name="profilePic"
          render={() => (
            <FormItem>
              <FormLabel className="place-self-center">Profile picture</FormLabel>
              <FormDescription className="text-center">
                Choose your profile picture.
              </FormDescription>
              <div className="flex flex-col items-center gap-2 mt-3">
                <AvatarUploadDroppable
                  previewUrl={previewUrl}
                  onFilesAdded={handleFilesAdded as any}
                  onRemoveImage={handleRemoveImage}
                />
                <div className="tex-accent text-center text-[10px] leading-3">
                  Click to upload <br /> Drag & drop supported
                </div>
              </div>

              <FormMessage />
            </FormItem>
          )}
        />

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="sm:max-w-xl p-2">
            <DialogHeader>
              <DialogTitle className="text-md font-semibold">Crop your profile picture</DialogTitle>
            </DialogHeader>
            {selectedImageUrl && (
              <Cropper
                className="h-80"
                image={selectedImageUrl}
                aspectRatio={1}
                onCropChange={(a) => {
                  const area = a as Area | null;
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
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={onCropConfirm}>
                Done
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="flex justify-between mb-0">
        <Button type="button" variant="secondary" onClick={onBack}>
          Back
        </Button>
        <Button type="button" onClick={onSubmit} disabled={!isValid}>
          Done ✔
        </Button>
      </div>
      <Img
        src="/complete-profile/boys-img.png"
        alt="Girl Greeting"
        width={380}
        height={380}
        className="absolute -bottom-15 left-1/2 transform -translate-x-1/2 -z-50"
      />
    </>
  );
}

async function cropImageToBlob(
  imageUrl: string,
  area: Area,
  outWidth: number,
  outHeight: number
): Promise<{ blob: Blob; url: string } | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = outWidth;
      canvas.height = outHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(null);

      // Draw cropped region from original image scaled into output canvas
      ctx.drawImage(img, area.x, area.y, area.width, area.height, 0, 0, outWidth, outHeight);

      canvas.toBlob((blob) => {
        if (!blob) return resolve(null);
        const url = URL.createObjectURL(blob);
        resolve({ blob, url });
      }, 'image/png');
    };
    img.onerror = () => resolve(null);
    img.src = imageUrl;
  });
}
