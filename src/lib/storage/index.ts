import { CloudinaryProvider } from './cloudinary-provider';
import type { IStorageProvider } from './types';

export function getStorageProvider(): IStorageProvider {
  const provider = process.env.STORAGE_PROVIDER ?? 'cloudinary';
  switch (provider) {
    case 'cloudinary':
    default:
      return new CloudinaryProvider();
  }
}

export * from './types';
