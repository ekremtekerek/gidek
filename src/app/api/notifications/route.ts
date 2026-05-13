import { listUnreadNotifications } from '@/lib/db/queries/notifications';
import { getCurrentUser } from '@/lib/security/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ notifications: [] });
  }
  try {
    const notifications = await listUnreadNotifications();
    return Response.json({ notifications });
  } catch {
    return Response.json({ notifications: [] }, { status: 500 });
  }
}
