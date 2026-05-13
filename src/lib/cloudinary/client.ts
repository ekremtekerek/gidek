import 'server-only';
import { v2 as cloudinary, type UploadApiResponse } from 'cloudinary';

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

if (CLOUD_NAME && API_KEY && API_SECRET) {
  cloudinary.config({
    cloud_name: CLOUD_NAME,
    api_key: API_KEY,
    api_secret: API_SECRET,
    secure: true,
  });
}

export const CLOUDINARY_READY = Boolean(CLOUD_NAME && API_KEY && API_SECRET);

export interface UploadedImage {
  url: string;
  publicId: string;
  width: number;
  height: number;
  bytes: number;
}

/**
 * Buffer'ı Cloudinary'e yükler. upload_stream'i Promise'e sarmıştır.
 * Folder + tag ile organize ediyoruz: gidek/deals/<id-if-known> gibi.
 */
export function uploadBuffer(buffer: Buffer, folder = 'gidek/deals'): Promise<UploadedImage> {
  if (!CLOUDINARY_READY) {
    return Promise.reject(new Error('Cloudinary yapılandırılmamış (env eksik).'));
  }
  return new Promise<UploadedImage>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image', format: 'webp' },
      (error, result: UploadApiResponse | undefined) => {
        if (error || !result) {
          reject(error ?? new Error('upload failed'));
          return;
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
          bytes: result.bytes,
        });
      },
    );
    stream.end(buffer);
  });
}
