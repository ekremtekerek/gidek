import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerClient } from '@/lib/db/server';

const querySchema = z.object({ id: z.string().uuid() });

/**
 * Mevcut kullanıcının verilen deal'i favorilemiş olup olmadığını döner.
 * Anonim çağrı → favorited:false. Cache-Control: private — CDN cache'lemesin.
 *
 * Bu endpoint'in varlığı, deal sayfasını ISR/static yapmaya izin verir:
 * page server-side auth okumaz, FavoriteButton mount'ta bunu çağırır.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({ id: searchParams.get('id') });
  if (!parsed.success) {
    return NextResponse.json({ favorited: false }, { status: 400 });
  }

  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { favorited: false },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  }

  const { data } = await supabase
    .from('favorites')
    .select('deal_id')
    .eq('deal_id', parsed.data.id)
    .eq('user_id', user.id)
    .maybeSingle();

  return NextResponse.json(
    { favorited: Boolean(data) },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
