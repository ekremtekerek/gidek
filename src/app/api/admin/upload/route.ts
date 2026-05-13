import sharp from 'sharp';
import { CLOUDINARY_READY, uploadBuffer } from '@/lib/cloudinary/client';
import { requireAdmin } from '@/lib/security/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
]);
const MAX_BYTES = 8 * 1024 * 1024; // 8 MB
const MAX_DIM = 1920;

export async function POST(req: Request) {
  await requireAdmin();
  if (!CLOUDINARY_READY) {
    return Response.json(
      { error: 'Cloudinary yapılandırılmamış. .env.local: CLOUDINARY_CLOUD_NAME / API_KEY / API_SECRET' },
      { status: 503 },
    );
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return Response.json({ error: 'Geçersiz form verisi.' }, { status: 400 });
  }

  const file = formData.get('file');
  if (!(file instanceof Blob)) {
    return Response.json({ error: 'Dosya gönderilmedi.' }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return Response.json(
      { error: 'Dosya 8MB sınırını aşıyor.' },
      { status: 400 },
    );
  }
  if (file.type && !ALLOWED_MIME.has(file.type.toLowerCase())) {
    return Response.json(
      { error: 'Sadece JPG, PNG, WebP veya HEIC dosyaları yüklenebilir.' },
      { status: 400 },
    );
  }

  let webp: Buffer;
  try {
    const arr = Buffer.from(await file.arrayBuffer());
    webp = await sharp(arr, { failOn: 'none' })
      .rotate() // EXIF orientation
      .resize({ width: MAX_DIM, height: MAX_DIM, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80, effort: 4 })
      .toBuffer();
  } catch {
    return Response.json(
      { error: 'Resim işlenemedi. Bozuk dosya olabilir.' },
      { status: 400 },
    );
  }

  try {
    const result = await uploadBuffer(webp);
    return Response.json(result);
  } catch (err) {
    console.error('[upload] cloudinary failed:', err);
    return Response.json({ error: 'Yükleme başarısız.' }, { status: 502 });
  }
}
