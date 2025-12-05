'use client';

import { FormField, FormItem } from '@/components/ui/form';
import {
  deleteHousingImageAction,
  uploadHousingImageAction,
} from '@/lib/actions/housing-ad-images';
import { resolveImageUrl, validateImageFile } from '@/lib/image_system/image-utils-client';
import type { HousingFormValues } from '@/lib/schemas/ads/housing-schema';
import { cn } from '@/lib/utils';
import {
  AlertCircle,
  GripHorizontal,
  Image as ImageIcon,
  Loader2,
  Star,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { Control, UseFormReturn } from 'react-hook-form';
import { FaImages } from 'react-icons/fa6';
import { toast } from 'sonner';

type Props = {
  form: UseFormReturn<HousingFormValues>;
  control: Control<HousingFormValues>;
  revalidateField: (fieldName: keyof HousingFormValues) => Promise<void>;
};

type ImageSlot = {
  storageKey: string;
  status: 'uploaded' | 'uploading' | 'error';
  message?: string;
  tempId?: string;
};

function HousingDialogStep7ImagesComponent({ form, control, revalidateField }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [slots, setSlots] = useState<(ImageSlot | null)[]>(Array(8).fill(null));
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const images = form.watch('images') || [];

  // Sync slots with form images
  useEffect(() => {
    const currentImages = form.getValues('images') || [];

    setSlots((prev) => {
      const newSlots: (ImageSlot | null)[] = Array(8).fill(null);

      // Keep uploading/error slots in their positions
      prev.forEach((slot, idx) => {
        if (slot && (slot.status === 'uploading' || slot.status === 'error')) {
          newSlots[idx] = slot;
        }
      });

      // Fill in uploaded images
      currentImages.forEach((key, idx) => {
        // Find first empty slot or use the image's index
        let targetIdx = idx;
        for (let i = 0; i < 8; i++) {
          if (!newSlots[i]) {
            targetIdx = i;
            break;
          }
        }
        newSlots[targetIdx] = { storageKey: key, status: 'uploaded' };
      });

      return newSlots;
    });

    // Auto-set first slot as cover if it has an image
    if (currentImages.length > 0) {
      const firstImage = currentImages[0];
      const currentCover = form.getValues('coverImageStorageKey');
      if (firstImage && currentCover !== firstImage) {
        form.setValue('coverImageStorageKey', firstImage, { shouldDirty: true, shouldTouch: true });
      }
    }
  }, [images.length, images.join(','), form]);

  const remainingSlots = 8 - images.length;

  const onSelectFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;

      const toUpload = Array.from(files).slice(0, remainingSlots);
      if (toUpload.length === 0) {
        toast.info('You already have 8 images');
        return;
      }

      // Find all empty slots upfront
      const emptySlots: number[] = [];
      slots.forEach((slot, idx) => {
        if (!slot && emptySlots.length < toUpload.length) {
          emptySlots.push(idx);
        }
      });

      // Validate all files first
      const validFiles: Array<{ file: File; slotIndex: number; tempId: string }> = [];
      for (let i = 0; i < toUpload.length; i++) {
        const file = toUpload[i];
        const validation = validateImageFile(file, 'ad-housing');
        if (!validation.success) {
          toast.error(validation.error);
          continue;
        }

        if (emptySlots[i] !== undefined) {
          validFiles.push({
            file,
            slotIndex: emptySlots[i],
            tempId: `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          });
        }
      }

      if (validFiles.length === 0) return;

      // Set all slots to uploading state simultaneously
      setSlots((prev) => {
        const next = [...prev];
        validFiles.forEach(({ slotIndex, tempId, file }) => {
          next[slotIndex] = {
            storageKey: '',
            status: 'uploading',
            tempId,
            message: file.name,
          };
        });
        return next;
      });

      // Upload all files simultaneously
      const uploadPromises = validFiles.map(async ({ file, slotIndex, tempId }) => {
        try {
          const fd = new FormData();
          fd.set('housingImage', file);
          const res = await uploadHousingImageAction(fd);
          if (!res.ok) throw new Error(res.error);

          // Update slot with uploaded image
          setSlots((prev) => {
            const next = [...prev];
            next[slotIndex] = {
              storageKey: res.data.storageKey,
              status: 'uploaded',
            };
            return next;
          });

          // Add storageKey to form images
          form.setValue('images', [...(form.getValues('images') || []), res.data.storageKey], {
            shouldDirty: true,
            shouldTouch: true,
          });

          // Set default cover if none yet
          const currentCover = form.getValues('coverImageStorageKey');
          if (!currentCover) {
            form.setValue('coverImageStorageKey', res.data.storageKey, {
              shouldDirty: true,
              shouldTouch: true,
            });
          }

          toast.success(`Image uploaded`);

          return { success: true, storageKey: res.data.storageKey };
        } catch (err: any) {
          const message = err?.message || 'Upload failed';

          // Update slot to error state
          setSlots((prev) => {
            const next = [...prev];
            next[slotIndex] = {
              storageKey: '',
              status: 'error',
              tempId,
              message,
            };
            return next;
          });

          toast.error(message);

          // Remove error slot after 3 seconds
          setTimeout(() => {
            setSlots((prev) => {
              const next = [...prev];
              if (next[slotIndex]?.tempId === tempId) {
                next[slotIndex] = null;
              }
              return next;
            });
          }, 3000);

          return { success: false };
        }
      });

      // Wait for all uploads to complete
      await Promise.all(uploadPromises);

      // Revalidate after all uploads are done
      await revalidateField('images');
      await revalidateField('coverImageStorageKey');
    },
    [form, revalidateField, remainingSlots, slots]
  );

  const onRemoveImage = useCallback(
    async (storageKey: string, slotIndex: number) => {
      try {
        // Optimistic UI: remove from form and slot first
        const prev = form.getValues('images') || [];
        const next = prev.filter((k) => k !== storageKey);
        form.setValue('images', next, { shouldDirty: true, shouldTouch: true });

        setSlots((prevSlots) => {
          const nextSlots = [...prevSlots];
          nextSlots[slotIndex] = null;
          return nextSlots;
        });

        // Adjust cover if needed
        const currentCover = form.getValues('coverImageStorageKey');
        if (currentCover === storageKey) {
          form.setValue('coverImageStorageKey', next[0] ?? null, {
            shouldDirty: true,
            shouldTouch: true,
          });
        }

        const del = await deleteHousingImageAction(storageKey);
        if (!('ok' in del) || !del.ok) {
          // Revert on failure
          form.setValue('images', prev, { shouldDirty: true, shouldTouch: true });
          form.setValue(
            'coverImageStorageKey',
            prev.includes(storageKey) ? form.getValues('coverImageStorageKey') : (prev[0] ?? null),
            { shouldDirty: true, shouldTouch: true }
          );
          throw new Error((del as any).error || 'Delete failed');
        }
        await revalidateField('images');
        await revalidateField('coverImageStorageKey');
      } catch (error: any) {
        toast.error(error?.message || 'Failed to remove image');
      }
    },
    [form, revalidateField]
  );

  const onSetCover = useCallback(
    async (storageKey: string) => {
      form.setValue('coverImageStorageKey', storageKey, { shouldDirty: true, shouldTouch: true });
      await revalidateField('coverImageStorageKey');
    },
    [form, revalidateField]
  );

  const handleDragStart = useCallback((index: number) => {
    setDraggedIndex(index);
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent, index: number) => {
      e.preventDefault();

      const targetSlot = slots[index];

      // Only allow drag over if target slot has an uploaded image (for swapping)
      // Don't allow drag over empty slots, uploading, or error slots
      if (!targetSlot || targetSlot.status !== 'uploaded') {
        setDragOverIndex(null);
        return;
      }

      setDragOverIndex(index);
    },
    [slots]
  );

  const handleDrop = useCallback(
    async (e: React.DragEvent, dropIndex: number) => {
      e.preventDefault();

      if (draggedIndex === null || draggedIndex === dropIndex) {
        setDraggedIndex(null);
        setDragOverIndex(null);
        return;
      }

      const draggedSlot = slots[draggedIndex];
      const dropSlot = slots[dropIndex];

      // Only allow swapping between two uploaded images
      if (!draggedSlot || draggedSlot.status !== 'uploaded') {
        setDraggedIndex(null);
        setDragOverIndex(null);
        return;
      }

      // Drop slot must also be an uploaded image
      if (!dropSlot || dropSlot.status !== 'uploaded') {
        setDraggedIndex(null);
        setDragOverIndex(null);
        return;
      }

      // Swap the two uploaded images
      setSlots((prev) => {
        const next = [...prev];
        next[draggedIndex] = dropSlot;
        next[dropIndex] = draggedSlot;
        return next;
      });

      // Update form images order
      const newImages = slots
        .map((slot, idx) => {
          if (idx === draggedIndex) return dropSlot.storageKey;
          if (idx === dropIndex) return draggedSlot.storageKey;
          return slot?.storageKey;
        })
        .filter((key): key is string => !!key && key !== '');

      form.setValue('images', newImages, { shouldDirty: true, shouldTouch: true });

      // If dropped into first slot (index 0), set as cover
      if (dropIndex === 0 && draggedSlot?.storageKey) {
        await onSetCover(draggedSlot.storageKey);
        toast.success('Cover image updated');
      }

      setDraggedIndex(null);
      setDragOverIndex(null);
    },
    [draggedIndex, slots, form, onSetCover]
  );

  return (
    <div className="step-container">
      {/* Header */}
      <div className="step-header-wrapper">
        <div className="step-header-content">
          <div className="step-header-icon-wrapper">
            <FaImages className="step-header-icon" />
          </div>
          <div>
            <h3 className="step-header-title">Property Images</h3>
            <p className="step-header-description">Showcase your property with stunning photos</p>
          </div>
        </div>
      </div>

      {/* Images FormField for validation */}
      <FormField
        control={control}
        name="images"
        render={({ fieldState }) => (
          <FormItem>
            {/* Upload Zone */}
            <div
              className="relative mx-4 sm:mx-6 p-8 sm:p-10 rounded-2xl border-2 border-dashed border-gray-300 hover:border-blue-500 transition-all duration-300 cursor-pointer group bg-gradient-to-br from-gray-50 to-gray-100/50"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (remainingSlots <= 0) return;
                const files = e.dataTransfer.files;
                onSelectFiles(files);
              }}
              onClick={() => remainingSlots > 0 && inputRef.current?.click()}
            >
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => onSelectFiles(e.target.files)}
                disabled={remainingSlots <= 0}
              />

              <div className="flex flex-col items-center justify-center gap-4">
                <div className="relative">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white border-2 border-gray-300 flex items-center justify-center group-hover:border-blue-500 group-hover:shadow-lg transition-all duration-300">
                    <Upload className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400 group-hover:text-blue-500 transition-colors" />
                  </div>
                  {remainingSlots > 0 && (
                    <div className="absolute -top-1 -right-1 w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg">
                      {remainingSlots}
                    </div>
                  )}
                </div>

                <div className="text-center space-y-2">
                  <p className="text-base sm:text-lg font-semibold text-gray-700">
                    {remainingSlots > 0 ? 'Upload Your Images' : 'All Slots Filled'}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500">
                    {remainingSlots > 0
                      ? 'Drag & drop or click to browse • Up to 8 images'
                      : 'Maximum images reached'}
                  </p>
                  {/* <p className="text-xs text-gray-400">PNG, JPG, WEBP • Max 15MB each</p> */}
                </div>
              </div>
            </div>

            {/* Display validation error with enhanced styling */}
            {fieldState.error && (
              <div className="mx-4 sm:mx-6 mt-4">
                <div className="p-4 bg-gradient-to-r from-red-50 via-red-50/80 to-orange-50 backdrop-blur-sm border border-red-200 rounded-xl flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-red-100 flex items-center justify-center mt-0.5">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-red-700 mb-1">Upload Required</p>
                    <p className="text-sm text-red-600">{fieldState.error.message}</p>
                  </div>
                </div>
              </div>
            )}
          </FormItem>
        )}
      />

      {/* Cover Image FormField for validation */}
      <FormField
        control={control}
        name="coverImageStorageKey"
        render={({ fieldState }) => (
          <FormItem>
            {fieldState.error && (
              <div className="mx-4 sm:mx-6">
                <div className="p-4 bg-gradient-to-r from-amber-50 via-yellow-50/80 to-orange-50 backdrop-blur-sm border border-amber-200 rounded-xl flex items-start gap-3 ">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center mt-0.5">
                    <Star className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-amber-700 mb-1">Cover Image</p>
                    <p className="text-sm text-amber-600">{fieldState.error.message}</p>
                  </div>
                </div>
              </div>
            )}
          </FormItem>
        )}
      />

      {/* Image Grid - Fixed 8 Slots (4 rows × 2 columns on mobile, 2 rows × 4 columns on desktop) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mx-4 sm:mx-6">
        {slots.map((slot, index) => {
          const isDragging = draggedIndex === index;
          const isDragOver = dragOverIndex === index;

          return (
            <div
              key={index}
              className={cn(
                'relative aspect-square rounded-2xl overflow-hidden transition-all duration-300',
                slot
                  ? 'bg-white hover:shadow-md border border-gray-200'
                  : 'border-2 border-dashed border-gray-300 bg-gradient-to-br from-gray-50 to-gray-100/30',
                isDragging && 'opacity-40 scale-95',
                isDragOver && slot && 'ring-2 ring-blue-500 ring-offset-2 scale-105'
              )}
              draggable={slot?.status === 'uploaded'}
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={() => {
                setDraggedIndex(null);
                setDragOverIndex(null);
              }}
            >
              {!slot ? (
                // Empty slot
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                  <ImageIcon className="w-8 h-8 sm:w-10 sm:h-10 mb-2 opacity-40" />
                  <span className="text-xs font-semibold opacity-60">{index + 1}</span>
                </div>
              ) : slot.status === 'uploading' ? (
                // Uploading state
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
                  <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 text-blue-500 animate-spin mb-2" />
                  <span className="text-xs sm:text-sm text-blue-600 font-semibold">
                    Uploading...
                  </span>
                </div>
              ) : slot.status === 'error' ? (
                // Error state
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 p-2">
                  <X className="w-8 h-8 text-red-500 mb-2" />
                  <span className="text-[10px] sm:text-xs text-red-600 font-semibold text-center leading-tight">
                    {slot.message || 'Upload failed'}
                  </span>
                </div>
              ) : (
                // Uploaded image
                <>
                  <img
                    src={resolveImageUrl(slot.storageKey, { width: 400, crop: 'fill' }) || ''}
                    alt={`Image ${index + 1}`}
                    className="absolute inset-0 w-full h-full object-cover"
                  />

                  {/* Cover Badge */}
                  {index === 0 ? (
                    <div className="absolute top-2 left-2 sm:top-3 sm:left-3 px-2 py-1 bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 rounded-lg flex items-center gap-1.5 shadow-xl z-10">
                      <Star className="w-3 h-3 text-white fill-white" />
                      <span className="text-[10px] sm:text-xs text-white font-semibold tracking-wide">
                        COVER
                      </span>
                    </div>
                  ) : (
                    <div className="absolute top-2 left-2 sm:top-3 sm:left-3 w-6 h-6 bg-black/50 backdrop-blur-md rounded-lg flex items-center justify-center text-white text-xs font-bold border border-white/20 shadow-lg z-10">
                      {index + 1}
                    </div>
                  )}

                  {/* Footer with Controls */}
                  <div className="absolute bottom-0 left-0 right-0 h-9 sm:h-8 bg-white/90 flex items-center justify-between px-3 sm:px-4 z-10 border-t border-gray-200/50 shadow-inner">
                    <div className="w-5" />

                    {/* Center - Drag Handle */}
                    <div className="flex items-center justify-center cursor-move">
                      <GripHorizontal className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 hover:text-gray-700 transition-colors" />
                    </div>

                    {/* Right - Delete Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveImage(slot.storageKey, index);
                      }}
                      className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200"
                      title="Delete image"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-[5]">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                      <p className="text-white text-xs sm:text-sm font-semibold drop-shadow-2xl px-3 py-1.5 bg-black/60 backdrop-blur-sm rounded-lg">
                        {index === 0 ? '★ Cover Image' : 'Drag to swap'}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Tips */}
      <div className="mx-4 sm:mx-6 p-4 sm:p-5 bg-gradient-to-br from-blue-50 to-indigo-50/50 border border-blue-200/50 rounded-2xl">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-sm font-bold">💡</span>
          </div>
          <ul className="flex-1 text-gray-700 text-xs sm:text-sm">
            <li className="flex items-start gap-2">
              <span className="text-blue-500 font-bold">•</span>
              <span>
                <strong className="font-semibold">First slot</strong> is always your cover image
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 font-bold">•</span>
              <span>Drag images between slots to reorder</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 font-bold">•</span>
              <span>Use the trash icon to remove unwanted photos</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

/**
 * Memoized version of Step 7 Images component to prevent unnecessary re-renders
 */
export const HousingDialogStep7Images = React.memo(HousingDialogStep7ImagesComponent);
