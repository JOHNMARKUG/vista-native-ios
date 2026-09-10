import React from 'react';
import { Text, View } from 'react-native';
import { colors, radius } from '../lib/theme';

export type BookingStatus =
  | 'pending'
  | 'scheduled'
  | 'confirmed'
  | 'driver_assigned'
  | 'en_route'
  | 'driver_arrived'
  | 'arrived'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'searching'
  | 'pending_payment';

// Restricted to navy / gold / success / error / neutral — no secondary
// accent hues. Waiting states read gold, active states read navy,
// terminal states read success or error. Filled tint, not an outline —
// matches how iOS's own tag/pill chips (Calendar, Reminders) read.
const CONFIG: Record<BookingStatus, { fg: string; bg: string; label: string }> = {
  pending: { fg: '#8A6413', bg: '#FBF0DA', label: 'Pending' },
  pending_payment: { fg: '#8A6413', bg: '#FBF0DA', label: 'Payment Pending' },
  searching: { fg: '#8A6413', bg: '#FBF0DA', label: 'Finding Driver' },
  scheduled: { fg: colors.navy, bg: '#E7ECFB', label: 'Scheduled' },
  confirmed: { fg: colors.navy, bg: '#E7ECFB', label: 'Confirmed' },
  driver_assigned: { fg: colors.navy, bg: '#E7ECFB', label: 'Driver Assigned' },
  en_route: { fg: colors.navy, bg: '#E7ECFB', label: 'On The Way' },
  driver_arrived: { fg: '#8A6413', bg: '#FBF0DA', label: 'Driver Arrived' },
  arrived: { fg: '#8A6413', bg: '#FBF0DA', label: 'Driver Arrived' },
  in_progress: { fg: colors.navy, bg: '#E7ECFB', label: 'In Progress' },
  completed: { fg: '#1E8E3E', bg: '#DFF6E4', label: 'Completed' },
  cancelled: { fg: '#B42318', bg: '#FDE3E1', label: 'Cancelled' },
};

export default function StatusBadge({ status, label }: { status: BookingStatus; label?: string }) {
  const cfg = CONFIG[status] ?? CONFIG.pending;
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        alignSelf: 'flex-start',
        backgroundColor: cfg.bg,
        borderRadius: radius.tag,
        paddingVertical: 4,
        paddingHorizontal: 8,
      }}
    >
      <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: cfg.fg }} />
      <Text style={{ fontSize: 11, fontWeight: '600', color: cfg.fg }}>{label ?? cfg.label}</Text>
    </View>
  );
}
