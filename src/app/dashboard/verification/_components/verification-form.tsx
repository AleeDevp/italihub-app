'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { useCityById } from '@/contexts/cities-context';
import type { VerificationFileRole, VerificationMethod } from '@/generated/prisma';
import { submitVerificationRequestAction } from '@/lib/actions/verification-actions';
import { useSession } from '@/lib/auth-client';
import { Enum } from '@/lib/enums';
import { Upload } from 'lucide-react';
import React, { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { VerificationFileUpload } from './verification-file-upload';

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

interface VerificationFormProps {
  onSuccess?: () => void;
}

const VERIFICATION_METHODS = [
  {
    value: Enum.VerificationMethod.LANDMARK_SELFIE,
    label: 'Landmark Selfie',
    description: 'Take a selfie with a recognizable landmark in your city',
  },
  {
    value: Enum.VerificationMethod.STUDENT_CARD,
    label: 'Student Card',
    description: 'University or school student identification card',
  },
  {
    value: Enum.VerificationMethod.IDENTITA,
    label: "Carta d'Identità",
    description: 'Italian national identity card',
  },
  {
    value: Enum.VerificationMethod.PERMESSO,
    label: 'Permesso di Soggiorno',
    description: 'Italian residence permit for non-EU citizens',
  },
  {
    value: Enum.VerificationMethod.RENTAL_CONTRACT,
    label: 'Rental Contract',
    description: 'Official rental agreement or housing contract',
  },
  {
    value: Enum.VerificationMethod.OTHER,
    label: 'Other Document',
    description: 'Other official document proving city residence',
  },
] as const;

export function VerificationForm({ onSuccess }: VerificationFormProps) {
  const [selectedMethod, setSelectedMethod] = useState<VerificationMethod | ''>('');
  const [userNote, setUserNote] = useState('');
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const session = useSession();
  const userCity = useCityById(session.data?.user?.cityId) || null;

  const handleFileChange = useCallback((file: UploadedFile | null) => {
    setUploadedFile(file);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!selectedMethod) {
      toast.error('Please select a verification method');
      return;
    }

    if (!uploadedFile) {
      toast.error('Please upload a verification image');
      return;
    }

    if (uploadedFile.status !== 'uploaded' || !uploadedFile.storageKey) {
      toast.error('Please wait for the image to finish uploading');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await submitVerificationRequestAction({
        method: selectedMethod as VerificationMethod,
        userNote: userNote.trim() || undefined,
        files: [
          {
            storageKey: uploadedFile.storageKey,
            role: uploadedFile.role as VerificationFileRole,
          },
        ],
      });

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success(
        "Verification request submitted successfully! We'll review your image and get back to you soon."
      );

      // Reset form
      setSelectedMethod('');
      setUserNote('');
      setUploadedFile(null);

      // Call success callback
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Verification submission error:', error);
      toast.error('Failed to submit verification request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedMethodInfo = VERIFICATION_METHODS.find((m) => m.value === selectedMethod);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex gap-2">
          <Upload className="h-5 w-5" />
          Submit Verification Request
        </CardTitle>
        <CardDescription>
          Choose your verification method and upload the required documents
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Verification Method Selection */}
          <div className="flex flex-wrap gap-4">
            <div className="space-y-3 flex-2">
              <Label htmlFor="method">Verification Method</Label>
              <Select
                value={selectedMethod}
                onValueChange={(value) => setSelectedMethod(value as VerificationMethod)}
                disabled={isSubmitting}
              >
                <SelectTrigger className="py-5 text-start">
                  <SelectValue placeholder="Select verification method" />
                </SelectTrigger>
                <SelectContent className="p-2">
                  {VERIFICATION_METHODS.map((method) => (
                    <SelectItem key={method.value} value={method.value}>
                      <div>
                        <div className="font-medium">{method.label}</div>
                        <div className="text-xs text-muted-foreground">{method.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 space-y-3 ">
              <Label>For City</Label>
              <p className="text-foreground font-semibold pl-2 border-l-1">{userCity?.name}</p>
            </div>
          </div>

          <Separator />

          {/* File Upload Section */}
          <div className="space-y-3">
            <Label>Verification Image *</Label>
            <VerificationFileUpload
              onFileChange={handleFileChange}
              verificationMethod={selectedMethod}
            />
            <p className="text-xs text-muted-foreground">
              Upload a clear, high-quality image. Make sure all text is readable and the image is
              not blurry.
            </p>
          </div>

          <Separator />

          {/* Additional Notes */}
          <div className="space-y-3">
            <Label htmlFor="note">Additional Notes (Optional)</Label>
            <Textarea
              id="note"
              placeholder="Any additional information that might help with your verification..."
              value={userNote}
              onChange={(e) => setUserNote(e.target.value)}
              disabled={isSubmitting}
              rows={3}
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-4">
            <Button
              type="submit"
              disabled={
                isSubmitting ||
                !selectedMethod ||
                !uploadedFile ||
                uploadedFile.status !== 'uploaded'
              }
              className="min-w-32"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Submitting...
                </div>
              ) : (
                'Submit Request'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
