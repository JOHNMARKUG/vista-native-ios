import { Ionicons } from '@expo/vector-icons';
import type { BookingStatus } from '../components/StatusBadge';

export const SERVICE_LABELS: Record<string, string> = {
  airport_pickup: 'Airport Pickup',
  airport_departure: 'Airport Departure',
  ministry_transport: 'Ministry Transport',
  group_convoy: 'Group Convoy',
  city_transfer: 'City Transfer',
  vip: 'VIP Service',
  crusade: 'Crusade Transport',
  conference: 'Conference Transport',
};

export const RIDE_LABELS: Record<string, string> = {
  boda: 'VISTA Ride — Boda Boda',
  standard: 'VISTA Ride — Car',
  premium: 'VISTA Ride — SUV',
  intercity: 'VISTA Ride — Intercity',
  hourly_standard: 'Hourly Hire — Standard',
  hourly_premium: 'Hourly Hire — Premium',
};

export const SERVICE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  airport_pickup: 'airplane-outline',
  airport_departure: 'airplane-outline',
  ministry_transport: 'business-outline',
  group_convoy: 'people-outline',
  city_transfer: 'car-outline',
  vip: 'star-outline',
  crusade: 'business-outline',
  conference: 'business-outline',
};

export const RIDE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  boda: 'bicycle-outline',
  standard: 'car-outline',
  premium: 'car-sport-outline',
  intercity: 'trail-sign-outline',
  hourly_standard: 'time-outline',
  hourly_premium: 'time-outline',
};

/** Statuses that still represent a trip in progress toward the customer —
 * shared between My Trips' "Active" filter and Home's next-trip card so the
 * two screens agree on what counts as "still happening". */
export const ACTIVE_STATUSES: BookingStatus[] = [
  'pending',
  'pending_payment',
  'searching',
  'scheduled',
  'confirmed',
  'driver_assigned',
  'en_route',
  'driver_arrived',
  'arrived',
  'in_progress',
];
