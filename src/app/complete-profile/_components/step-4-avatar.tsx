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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import {
  cropImageToBlob,
  validateImageFile,
  type CropArea,
} from '@/lib/image_system/image-utils-client';
import { Step4Schema } from '@/lib/schemas/complete-profile-schema';
import * as React from 'react';
import { UseFormReturn, useWatch } from 'react-hook-form';
import { z } from 'zod';

import Img from 'next/image';

interface StepProps {
  form: UseFormReturn<z.infer<typeof Step4Schema> & any>;
  onBack: () => void;
  onSubmit: () => void;
}

export function Step4Avatar({ form, onBack, onSubmit }: StepProps) {
  const file = useWatch({ control: form.control, name: 'profilePic' });
  const [open, setOpen] = React.useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = React.useState<string | null>(null);
  const cropAreaRef = React.useRef<CropArea | null>(null);
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

  // Enhanced validation using both old schema and new image validation
  const isValid = React.useMemo(() => {
    if (!file) return true; // Allow no file (optional)

    // First check with existing Step4Schema for backward compatibility
    const basicValid = Step4Schema.safeParse({ profilePic: file }).success;
    if (!basicValid) return false;

    // Then validate with new image-specific validation for better error handling
    if (file instanceof File) {
      const imageValidation = validateImageFile(file, 'avatar');
      return imageValidation.success;
    }

    return true;
  }, [file]);

  const handleFilesAdded = React.useCallback((added: { file: File }[]) => {
    const f = added[0]?.file;
    if (!f) return;

    // Enhanced validation using new image system
    const validation = validateImageFile(f, 'avatar');
    if (!validation.success) {
      // Could show a toast or error message here
      console.error('Avatar validation failed:', validation.error);
      return;
    }

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

    try {
      // Use avatar-optimized dimensions (from IMAGE_TYPE_CONFIGS)
      const cropped = await cropImageToBlob(selectedImageUrl, area, 256, 256);
      if (cropped) {
        const file = new File([cropped.blob], 'avatar.png', { type: cropped.blob.type });

        // Validate the cropped file as well
        const validation = validateImageFile(file, 'avatar');
        if (validation.success) {
          form.setValue('profilePic', file, { shouldValidate: true, shouldDirty: true });
          setPreviewUrl(cropped.url);
        } else {
          console.error('Cropped avatar validation failed:', validation.error);
          return;
        }
      }
      setOpen(false);
    } catch (error) {
      console.error('Failed to crop avatar:', error);
      // Could show error toast here
    }
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
      <div className="flex flex-col justify-between h-full p-8">
        <div className="space-y-6">
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
                <DialogTitle className="text-md font-semibold">
                  Crop your profile picture
                </DialogTitle>
                <DialogDescription className="sr-only">
                  Adjust and confirm the crop area to set your profile picture. Use mouse or touch
                  to move and resize the square crop region.
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
                <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="button" onClick={onCropConfirm} disabled={!isValid}>
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
      </div>
      <Img
        src="/complete-profile/boys-img.png"
        alt="Girl Greeting"
        height={400}
        width={400}
        priority={true}
        draggable={false}
        className="absolute object-contain h-95 w-auto -bottom-15 left-1/2 transform -translate-x-1/2 -z-50"
      />
    </>
  );
}
