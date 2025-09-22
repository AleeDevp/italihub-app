'use client';

import { CircleUserRoundIcon, XIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useFileUpload, type FileWithPreview } from '@/hooks/use-file-upload';

type AvatarUploadDroppableProps = {
  // If provided, this URL will be used for preview instead of internal state
  previewUrl?: string | null;
  // Called when new files are added (before cropping)
  onFilesAdded?: (files: FileWithPreview[]) => void;
  // Called when user removes current image
  onRemoveImage?: () => void;
};

export default function AvatarUploadDroppable(props: AvatarUploadDroppableProps) {
  const [
    { files, isDragging },
    {
      removeFile,
      openFileDialog,
      getInputProps,
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
    },
  ] = useFileUpload({
    accept: 'image/*',
    onFilesAdded: props.onFilesAdded,
  });

  // If parent provides previewUrl (even null), treat as controlled and do NOT fallback to internal files
  const previewUrl =
    props.previewUrl !== undefined ? props.previewUrl : (files[0]?.preview ?? null);

  const handleRemove = () => {
    if (files[0]?.id) {
      removeFile(files[0]?.id);
    }
    props.onRemoveImage?.();
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative inline-flex">
        {/* Drop area */}
        <button
          type="button"
          className="border-accent hover:bg-accent/25 data-[dragging=true]:bg-accent/50 focus-visible:border-ring focus-visible:ring-ring/50 relative flex size-25 items-center justify-center overflow-hidden rounded-full border-2 border-dashed transition-colors outline-none focus-visible:ring-[3px] has-disabled:pointer-events-none has-disabled:opacity-50 has-[img]:border-none"
          onClick={openFileDialog}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          data-dragging={isDragging || undefined}
          aria-label={previewUrl ? 'Change image' : 'Upload image'}
        >
          {previewUrl ? (
            <img
              className="size-full object-cover"
              src={previewUrl}
              alt={(files[0]?.file as File | undefined)?.name || 'Uploaded image'}
              width={64}
              height={64}
              style={{ objectFit: 'cover' }}
            />
          ) : (
            <div aria-hidden="true">
              <CircleUserRoundIcon className="size-6 opacity-60 text-accent" />
            </div>
          )}
        </button>
        {previewUrl && (
          <Button
            type="button"
            onClick={handleRemove}
            size="icon"
            className="bg-red-500 border-background focus-visible:border-background absolute top-0 right-1 size-6 rounded-full border-2 shadow-none"
            aria-label="Remove image"
          >
            <XIcon className="size-3.5" />
          </Button>
        )}
        <input
          {...getInputProps()}
          className="sr-only"
          aria-label="Upload image file"
          tabIndex={-1}
        />
      </div>
    </div>
  );
}
