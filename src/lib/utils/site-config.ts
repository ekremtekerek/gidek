export const SITE = {
  name: 'gidek',
  domain: 'gidek.net',
  tagline: 'AI ile sana özel fırsatlar',
  description:
    'Ne yapmak istediğini söyle, gidek senin için en uygun fırsatları bulsun. Tiyatro, kahvaltı, tatil, masaj ve daha fazlası.',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
  locale: 'tr_TR',
  defaultOgImage: '/og-default.png',
  social: {
    instagram: 'https://instagram.com/gideknet',
    x: 'https://x.com/gideknet',
  },
} as const;

export const FOOTER_LEGAL_LINKS = [
  { href: '/yasal/kullanim-kosullari', label: 'Kullanım Koşulları' },
  { href: '/yasal/gizlilik', label: 'Gizlilik Politikası' },
  { href: '/yasal/kvkk', label: 'KVKK Aydınlatma Metni' },
  { href: '/yasal/cerezler', label: 'Çerez Politikası' },
] as const;
