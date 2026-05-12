import type { Metadata } from 'next';
import { ChatContainer } from '@/components/kesfet/chat-container';
import { Container } from '@/components/ui/container';

export const metadata: Metadata = {
  title: 'AI ile keşfet',
  description: 'Ne yapmak istediğini söyle, gidek seninle konuşarak en uygun fırsatı bulsun.',
  alternates: { canonical: '/kesfet' },
};

export const dynamic = 'force-dynamic';

export default function KesfetPage() {
  return (
    <Container className="py-8 sm:py-12">
      <ChatContainer />
    </Container>
  );
}
