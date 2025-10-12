'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { VerificationFileRole } from '@/generated/prisma';
import { useFileUpload } from '@/hooks/use-file-upload';
import { uploadVerificationFileAction } from '@/lib/actions/verification-actions';
import { validateImageFile, type FileWithPreview } from '@/lib/image_system/image-utils-client';
import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle, File as FileIcon, FileImage, Upload, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface UploadedFile {
  id: string;
  storageKey: string;
  name: string;
  size: number;
  type: string;
  role: VerificationFileRole;
  status: 'uploading' | 'uploaded' | 'error';
  error?: string;
}

interface VerificationFileUploadProps {
  onFileChange: (file: UploadedFile | null) => void;
  verificationMethod?: string; // Used to determine file role
  className?: string;
}

export function VerificationFileUpload({
  onFileChange,
  verificationMethod,
  className,
}: VerificationFileUploadProps) {
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [
    { files, errors, isDragging },
    { handleDrop, openFileDialog, clearFiles, removeFile, getInputProps },
  ] = useFileUpload({
    imageType: 'verification', // Uses unified validation for verification files
    multiple: false,
    maxFiles: 1,
    onFilesAdded: async (newFiles) => {
      await handleFileUpload(newFiles);
    },
  });

  const handleFileUpload = async (newFiles: FileWithPreview[]) => {
    if (newFiles.length === 0) return;

    // Only handle the first file since we only allow one
    const fileWithPreview = newFiles[0];
    const file = fileWithPreview.file;

    // Clear any existing file first
    if (uploadedFile) {
      handleRemoveFile();
    }

    // Ensure we have an actual File object
    if (!(file instanceof File)) {
      console.error('Invalid file type:', typeof file);
      return;
    }

    setIsUploading(true);

    const tempId = `temp-${Date.now()}-${Math.random()}`;

    // Determine role based on verification method
    const fileRole =
      verificationMethod === 'LANDMARK_SELFIE'
        ? VerificationFileRole.IMAGE
        : VerificationFileRole.DOCUMENT;

    // Create temporary uploaded file entry
    const tempUploadedFile: UploadedFile = {
      id: tempId,
      storageKey: '',
      name: file.name,
      size: file.size,
      type: file.type,
      role: fileRole as VerificationFileRole,
      status: 'uploading',
    };

    // Set state to show progress
    setUploadedFile(tempUploadedFile);

    try {
      // Validate file using unified validation
      const validation = validateImageFile(file, 'verification');
      if (!validation.success) {
        throw new Error(validation.error);
      }

      // Upload file
      const formData = new FormData();
      formData.append('verificationFile', file);
      formData.append('role', fileRole);

      const result = await uploadVerificationFileAction(formData);

      if (!result.ok) {
        throw new Error(result.error);
      }

      // Update the file with success
      const successFile: UploadedFile = {
        ...tempUploadedFile,
        storageKey: result.data.storageKey,
        status: 'uploaded' as const,
      };

      setUploadedFile(successFile);
      onFileChange(successFile);
      toast.success(`${file.name} uploaded successfully`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';

      // Update the file with error
      const errorFile: UploadedFile = {
        ...tempUploadedFile,
        status: 'error' as const,
        error: errorMessage,
      };

      setUploadedFile(errorFile);
      toast.error(`Failed to upload ${file.name}: ${errorMessage}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    onFileChange(null);
    clearFiles();
  };

  // Update parent component when file changes
  useEffect(() => {
    if (uploadedFile?.status === 'uploaded') {
      onFileChange(uploadedFile);
    } else {
      onFileChange(null);
    }
  }, [uploadedFile, onFileChange]);

  const getFileIcon = (type: string, status: UploadedFile['status']) => {
    if (status === 'uploading') {
      return (
        <div className="w-4 h-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      );
    }
    if (status === 'error') {
      return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
    if (type.startsWith('image/')) {
      return <FileImage className="w-4 h-4 text-blue-500" />;
    }
    return <FileIcon className="w-4 h-4 text-gray-500" />;
  };

  const getStatusBadge = (status: UploadedFile['status']) => {
    switch (status) {
      case 'uploading':
        return <Badge variant="secondary">Uploading...</Badge>;
      case 'uploaded':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Uploaded
          </Badge>
        );
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Hidden file input */}
      <input {...getInputProps()} style={{ display: 'none' }} />

      {/* Upload Area - Only show if no file is uploaded */}
      {!uploadedFile && (
        <Card
          className={cn(
            'group bg-transparent shadow-none border-2 border-dashed cursor-pointer transition-all duration-200',
            'hover:border-blue-400 hover:bg-blue-50/50',
            isDragging && 'border-blue-500 bg-blue-50',
            isUploading && 'opacity-50 pointer-events-none'
          )}
        >
          <CardContent
            className="flex flex-col items-center justify-center py-8 px-4 text-center"
            onClick={!isUploading ? openFileDialog : undefined}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onDragEnter={(e) => e.preventDefault()}
          >
            <Upload
              className={cn(
                'w-8 h-8 mb-2 transition-colors duration-200',
                isDragging ? 'text-blue-500' : 'text-gray-400',
                'group-hover:text-blue-500'
              )}
            />
            <p className="text-sm font-medium mb-1">
              {isUploading
                ? 'Uploading image...'
                : 'Drop verification image here or click to browse'}
            </p>
            <p className="text-xs text-muted-foreground">
              Supports images only (JPG, PNG, WebP, AVIF) up to 8MB
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {verificationMethod === 'LANDMARK_SELFIE'
                ? 'Upload a selfie with a recognizable city landmark'
                : 'Upload a clear photo of your verification document'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Error Messages */}
      {errors.length > 0 && (
        <div className="space-y-2">
          {errors.map((error, index) => (
            <p key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded">
              {error}
            </p>
          ))}
        </div>
      )}

      {/* Uploaded File Display */}
      {uploadedFile && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Uploaded Image</h4>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {getFileIcon(uploadedFile.type, uploadedFile.status)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{uploadedFile.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB • {uploadedFile.role}
                </p>
                {uploadedFile.error && <p className="text-xs text-red-600">{uploadedFile.error}</p>}
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(uploadedFile.status)}
                {uploadedFile.status !== 'uploading' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveFile}
                    className="h-6 w-6 p-0"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
