import { z } from 'zod';
import { getServerClient } from '@/lib/db/server';
import { getCurrentUser } from '@/lib/security/auth';

export const dynamic = 'force-dynamic';

const idSchema = z.string().uuid();

/** Sohbet sil — sadece sahibinin yapabildiği, cascade ile mesajları gider. */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return new Response(null, { status: 401 });

  const { id } = await params;
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return new Response(null, { status: 400 });

  const supabase = await getServerClient();
  const { error } = await supabase
    .from('conversations')
    .delete()
    .eq('id', parsed.data)
    .eq('user_id', user.id);
  if (error) return new Response(null, { status: 500 });
  return new Response(null, { status: 204 });
}
