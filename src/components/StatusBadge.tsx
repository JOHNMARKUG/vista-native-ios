import React from 'react';
import { Text, View } from 'react-native';

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

const CONFIG: Record<BookingStatus, { bg: string; fg: string; label: string }> = {
  pending: { bg: '#FFF3D6', fg: '#8A6413', label: 'Pending' },
  pending_payment: { bg: '#FFF3D6', fg: '#8A6413', label: 'Payment Pending' },
  searching: { bg: '#FFF3D6', fg: '#8A6413', label: 'Finding Driver' },
  scheduled: { bg: '#E7ECFB', fg: '#1B2E6B', label: 'Scheduled' },
  confirmed: { bg: '#E7ECFB', fg: '#1B2E6B', label: 'Confirmed' },
  driver_assigned: { bg: '#E7ECFB', fg: '#2563EB', label: 'Driver Assigned' },
  en_route: { bg: '#EFE7FB', fg: '#7C3AED', label: 'On The Way' },
  driver_arrived: { bg: '#FFF3D6', fg: '#8A6413', label: 'Driver Arrived' },
  arrived: { bg: '#FFF3D6', fg: '#8A6413', label: 'Driver Arrived' },
  in_progress: { bg: '#E7ECFB', fg: '#1B2E6B', label: 'In Progress' },
  completed: { bg: '#DFF6E4', fg: '#1E8E3E', label: 'Completed' },
  cancelled: { bg: '#FDE3E1', fg: '#B42318', label: 'Cancelled' },
};

export default function StatusBadge({ status, label }: { status: BookingStatus; label?: string }) {
  const cfg = CONFIG[status] ?? CONFIG.pending;
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        alignSelf: 'flex-start',
        backgroundColor: cfg.bg,
        borderRadius: 20,
        paddingVertical: 4,
        paddingHorizontal: 10,
      }}
    >
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: cfg.fg }} />
      <Text style={{ fontSize: 11, fontWeight: '700', color: cfg.fg }}>{label ?? cfg.label}</Text>
    </View>
  );
}
