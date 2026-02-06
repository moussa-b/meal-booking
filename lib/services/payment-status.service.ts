export type PaymentStatusBadgeType = 'paid' | 'pending' | 'error';

/**
 * Returns Tailwind classes for payment status badge styling.
 */
export function getStatusBadgeClass(type: PaymentStatusBadgeType): string {
  switch (type) {
    case 'paid':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'error':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return '';
  }
}

/**
 * Maps raw payment status string to badge type for styling.
 */
export function getStatusBadgeType(status: string): PaymentStatusBadgeType {
  if (status === 'PAID') return 'paid';
  if (status === 'PENDING' || status === 'PROCESSING') return 'pending';
  return 'error';
}
