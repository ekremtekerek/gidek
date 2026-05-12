import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'picsum.photos' },
    ],
  },
  async redirects() {
    return [
      // Old /kesfet entry-points (hero CTA, chips, shared links) now land
      // straight on the homepage where the chat lives. Query strings (e.g.
      // ?q=Cumartesi+akşam) are preserved by Next.js, and ChatContainer
      // picks them up to auto-send the first message.
      { source: '/kesfet', destination: '/', permanent: false },
    ];
  },
};

export default nextConfig;
