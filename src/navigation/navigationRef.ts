import { createNavigationContainerRef } from '@react-navigation/native';
import type { RootTabParamList } from './types';

export const navigationRef = createNavigationContainerRef<RootTabParamList>();

/** Notification payload convention: `data.source` says which stack owns the
 * detail screen, `data.id` is the booking/ride/package row id. Falls back
 * to just switching to the Trips tab if the shape isn't recognized. */
export function navigateFromNotificationData(data: Record<string, unknown> | undefined) {
  if (!navigationRef.isReady() || !data) return;

  const source = data.source;
  const id = data.id;

  if (typeof id === 'string' && (source === 'ride' || source === 'booking')) {
    navigationRef.navigate('TripsTab', {
      screen: 'TripDetail',
      params: { id, source },
    } as never);
    return;
  }

  navigationRef.navigate('TripsTab' as never);
}
