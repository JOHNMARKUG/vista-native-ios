// Auto-generates the day-by-day pilgrimage schedule from an arrival/departure
// date pair. The church program is tied to actual weekdays (registration is
// always Friday, prayer line always Saturday, etc.) regardless of which day
// of the stay it falls on, so the schedule is built from real calendar dates,
// not relative day-offsets — this works for standard, extended, and custom stays.

const DAY_MS = 24 * 60 * 60 * 1000;

import type { Ionicons } from '@expo/vector-icons';

export type ScheduleIcon = keyof typeof Ionicons.glyphMap;

export type ScheduleDay = {
  date: string;
  dateLabel: string;
  label: string;
  items: { icon: ScheduleIcon; text: string }[];
};

function fmtDate(d: Date) {
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

function addDays(date: Date, n: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

export function buildSchedule(
  arrivalDate: string,
  departureDate: string,
  arrivalTime?: string,
  departureTime?: string
): ScheduleDay[] {
  const arrival = new Date(arrivalDate + 'T00:00:00');
  const departure = new Date(departureDate + 'T00:00:00');
  const totalDays = Math.round((departure.getTime() - arrival.getTime()) / DAY_MS) + 1;

  const days: ScheduleDay[] = [];
  for (let i = 0; i < totalDays; i++) {
    const date = addDays(arrival, i);
    const weekday = date.getDay();
    const isFirst = i === 0;
    const isLast = i === totalDays - 1;

    let label: string;
    let items: { icon: ScheduleIcon; text: string }[];

    if (isFirst) {
      label = 'Arrival Day';
      items = [
        { icon: 'airplane-outline', text: `Airport pickup${arrivalTime ? ` at ${arrivalTime}` : ' at your flight arrival time'}` },
        { icon: 'bed-outline', text: 'Transfer to your hotel' },
        { icon: 'moon-outline', text: 'Check in and rest' },
      ];
    } else if (isLast) {
      label = 'Departure Day';
      items = [
        { icon: 'car-outline', text: 'Driver pickup from hotel' },
        { icon: 'airplane-outline', text: `Transfer to Entebbe International Airport${departureTime ? ` for your ${departureTime} flight` : ''}` },
      ];
    } else if (weekday === 5) {
      label = 'Registration Day';
      items = [
        { icon: 'car-outline', text: 'Driver pickup at 8:30am' },
        { icon: 'business-outline', text: 'Temple Mount Church — registration 9:00am to 5:00pm' },
        { icon: 'bed-outline', text: 'Return to hotel' },
      ];
    } else if (weekday === 6) {
      label = 'Prayer Line Day';
      items = [
        { icon: 'car-outline', text: 'Driver pickup at 6:30am' },
        { icon: 'people-outline', text: 'Temple Mount Church — service from 7:00am' },
        { icon: 'alert-circle-outline', text: 'Service runs late — your driver waits for you' },
        { icon: 'bed-outline', text: 'Return to hotel when service ends' },
      ];
    } else if (weekday === 0) {
      label = 'General Service Day';
      items = [
        { icon: 'car-outline', text: 'Driver pickup at 6:30am' },
        { icon: 'people-outline', text: 'Temple Mount Church — service from 7:00am' },
        { icon: 'alert-circle-outline', text: 'Service runs late — your driver waits for you' },
        { icon: 'bed-outline', text: 'Return to hotel when service ends' },
      ];
    } else if (weekday === 1) {
      label = 'Prophet Meeting Day';
      items = [
        { icon: 'car-outline', text: 'Driver pickup at 6:30am' },
        { icon: 'people-outline', text: 'Temple Mount Church — international visitors meet the Prophet, from 7:00am' },
        { icon: 'alert-circle-outline', text: 'Service runs very late — your driver waits for you' },
        { icon: 'bed-outline', text: 'Return to hotel when service ends' },
      ];
    } else if (weekday === 2) {
      label = 'Prophet Appointment Day';
      items = [
        { icon: 'car-outline', text: 'Driver pickup from hotel' },
        { icon: 'calendar-outline', text: 'Prophet appointment during the day' },
        { icon: 'bed-outline', text: 'Return to hotel' },
      ];
    } else {
      label = 'Free Day';
      items = [
        { icon: 'sunny-outline', text: 'No church program today — rest at your hotel' },
        { icon: 'car-outline', text: 'Your driver is on call if you need to go anywhere in the city' },
      ];
    }

    days.push({ date: date.toISOString().split('T')[0], dateLabel: fmtDate(date), label, items });
  }

  return days;
}

export const PACKAGE_TIERS = {
  standard: {
    key: 'standard' as const,
    days: 6,
    label: 'Standard Visit',
    subtitle: 'Thursday → Tuesday',
    price: 150,
    mostPopular: true,
    bullets: [
      { icon: 'airplane-outline', text: 'Arrive Thursday' },
      { icon: 'business-outline', text: 'Registration Friday' },
      { icon: 'people-outline', text: 'Prayer line Saturday' },
      { icon: 'people-outline', text: 'General service Sunday' },
      { icon: 'people-outline', text: 'Meet the Prophet Monday' },
      { icon: 'airplane-outline', text: 'Depart Tuesday' },
    ],
  },
  extended: {
    key: 'extended' as const,
    days: 7,
    label: 'Extended Visit',
    subtitle: 'Thursday → Wednesday',
    price: 180,
    bullets: [
      { icon: 'checkmark-outline', text: 'Everything in Standard, plus:' },
      { icon: 'calendar-outline', text: 'Prophet appointment Tuesday' },
      { icon: 'airplane-outline', text: 'Depart Wednesday' },
    ],
  },
  custom: {
    key: 'custom' as const,
    label: 'Custom Stay',
    subtitle: 'I need different dates',
    basePrice: 150,
    perExtraDay: 30,
  },
};

export type PackageTierKey = keyof typeof PACKAGE_TIERS;

export function calcCustomPrice(durationDays: number) {
  const extraDays = Math.max(0, durationDays - PACKAGE_TIERS.standard.days);
  return {
    extraDays,
    total: PACKAGE_TIERS.custom.basePrice + extraDays * PACKAGE_TIERS.custom.perExtraDay,
  };
}

export function genBookingRef() {
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `PKG-${rand}`;
}
