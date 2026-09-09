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
// terminal states read success or error.
const CONFIG: Record<BookingStatus, { fg: string; label: string }> = {
  pending: { fg: colors.gold, label: 'Pending' },
  pending_payment: { fg: colors.gold, label: 'Payment Pending' },
  searching: { fg: colors.gold, label: 'Finding Driver' },
  scheduled: { fg: colors.navy, label: 'Scheduled' },
  confirmed: { fg: colors.navy, label: 'Confirmed' },
  driver_assigned: { fg: colors.navy, label: 'Driver Assigned' },
  en_route: { fg: colors.navy, label: 'On The Way' },
  driver_arrived: { fg: colors.gold, label: 'Driver Arrived' },
  arrived: { fg: colors.gold, label: 'Driver Arrived' },
  in_progress: { fg: colors.navy, label: 'In Progress' },
  completed: { fg: colors.success, label: 'Completed' },
  cancelled: { fg: colors.error, label: 'Cancelled' },
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
        borderWidth: 1,
        borderColor: cfg.fg,
        borderRadius: radius.tag,
        paddingVertical: 3,
        paddingHorizontal: 8,
      }}
    >
      <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: cfg.fg }} />
      <Text style={{ fontSize: 11, fontWeight: '600', color: cfg.fg }}>{label ?? cfg.label}</Text>
    </View>
  );
}
