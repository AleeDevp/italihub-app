import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
  secure: true,
});

export { cloudinary };

// server side usage
export function cldUrl(storageKey: string, opts?: { w?: number }) {
  const base = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`;
  const t = `f_auto,q_auto${opts?.w ? `,w_${opts.w}` : ''}`;
  return `${base}/${t}/${storageKey}`;
}
