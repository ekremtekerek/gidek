import type { BookingStatus } from '@/lib/utils/constants';

export const BOOKING_STATUS_LABEL: Record<BookingStatus, string> = {
  pending: 'Onay bekliyor',
  confirmed: 'Onaylandı',
  cancelled: 'İptal edildi',
  used: 'Kullanıldı',
};

export const BOOKING_STATUS_BADGE: Record<
  BookingStatus,
  'default' | 'success' | 'warning' | 'outline'
> = {
  pending: 'warning',
  confirmed: 'success',
  cancelled: 'outline',
  used: 'default',
};

export function isCancellable(status: BookingStatus): boolean {
  return status === 'pending' || status === 'confirmed';
}
