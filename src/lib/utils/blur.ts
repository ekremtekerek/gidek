/**
 * Tek doğruluk kaynağı blur placeholder. next/image'a `placeholder="blur"`
 * + `blurDataURL={BLUR_DATA_URL}` olarak verilir. Base64-encoded SVG —
 * runtime maliyeti yok, layout-shift'siz progressive load sağlar.
 */
const shimmer = (w: number, h: number) => `
<svg width="${w}" height="${h}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <linearGradient id="g">
      <stop stop-color="#f4f4f5" offset="0%"/>
      <stop stop-color="#e4e4e7" offset="50%"/>
      <stop stop-color="#f4f4f5" offset="100%"/>
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="#f4f4f5"/>
  <rect id="r" width="${w}" height="${h}" fill="url(#g)"/>
  <animate xlink:href="#r" attributeName="x" from="-${w}" to="${w}" dur="1.2s" repeatCount="indefinite"  />
</svg>`;

function toBase64(str: string): string {
  if (typeof window === 'undefined') {
    return Buffer.from(str).toString('base64');
  }
  return window.btoa(str);
}

export const BLUR_DATA_URL = `data:image/svg+xml;base64,${toBase64(shimmer(700, 475))}`;
