import type { Ionicons } from '@expo/vector-icons';

export type PaymentMethodKey = 'mtn' | 'airtel' | 'card' | 'cash';

export const PAYMENT_METHODS: {
  key: PaymentMethodKey;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { key: 'mtn', label: 'MTN Mobile Money', icon: 'phone-portrait-outline' },
  { key: 'airtel', label: 'Airtel Money', icon: 'phone-portrait-outline' },
  { key: 'card', label: 'Visa / Mastercard', icon: 'card-outline' },
  { key: 'cash', label: 'Cash to Driver', icon: 'cash-outline' },
];

/** `profiles.preferred_payment_method` stores the display label (e.g. "MTN
 * Mobile Money"), not the short key — this maps one to the other so booking
 * screens can default to it. */
export function paymentKeyFromLabel(label: string | null | undefined): PaymentMethodKey {
  return PAYMENT_METHODS.find((m) => m.label === label)?.key ?? 'cash';
}
