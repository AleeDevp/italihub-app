export type UploadOptions = {
  publicId?: string; // provider-specific id suggestion
  folder?: string;
  transformation?: Record<string, any>;
  resourceType?: 'image' | 'auto';
};

export type UploadResult = {
  storageKey: string;
  publicId: string;
  width?: number;
  height?: number;
  bytes?: number;
  format?: string;
  url: string;
  secureUrl: string;
};

export interface IStorageProvider {
  uploadBuffer(buffer: Buffer, opts: UploadOptions): Promise<UploadResult>;
  deleteByStorageKey(storageKey: string): Promise<void>;
  deleteManyByStorageKeys(storageKeys: string[]): Promise<void>;
  // Optional provider-specific helpers
  getPreviewUrl?(publicId: string, options?: { width?: number; page?: number }): string | null;
  getSignedUrl?(storageKey: string, options?: { resourceType?: 'image' | 'raw' }): string | null;
}
