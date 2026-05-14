import { NextResponse } from 'next/server';
import { getServerClient } from '@/lib/db/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Auth-aware island endpoint: belirtilen hedefe karşı kullanıcının follow
 * durumunu döner. Anon kullanıcı için isFollowing=false.
 *
 * Hızlı tek tablo lookup; ISR sayfasında client-side mount'ta çağrılır.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const userId = url.searchParams.get('userId');
  if (!userId || !/^[0-9a-f-]{36}$/i.test(userId)) {
    return NextResponse.json({ error: 'invalid_user' }, { status: 400 });
  }

  const supabase = await getServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return NextResponse.json({ isFollowing: false, signedIn: false });
  }
  if (auth.user.id === userId) {
    return NextResponse.json({ isFollowing: false, signedIn: true, isSelf: true });
  }

  const { data } = await supabase
    .from('follows')
    .select('follower_id')
    .eq('follower_id', auth.user.id)
    .eq('followee_id', userId)
    .maybeSingle();

  return NextResponse.json({
    isFollowing: Boolean(data),
    signedIn: true,
    isSelf: false,
  });
}
