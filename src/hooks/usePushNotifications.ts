import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { supabase } from '../lib/supabase';
import { registerForPushNotificationsAsync } from '../lib/pushNotifications';
import { navigateFromNotificationData } from '../navigation/navigationRef';

/**
 * Registers this device for push once a user is signed in, saves the Expo
 * push token to their profile (only when it actually changed, so this
 * doesn't hit the DB on every render), and wires up tap-to-navigate.
 *
 * Registration failing (denied permission, simulator, transient error) is
 * never fatal — the rest of the app works the same either way, the user
 * just won't get pushes.
 */
export function usePushNotifications(userId: string | undefined) {
  const lastSavedToken = useRef<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    registerForPushNotificationsAsync().then((token) => {
      if (cancelled || !token || token === lastSavedToken.current) return;
      lastSavedToken.current = token;
      supabase.from('profiles').update({ fcm_token: token }).eq('id', userId).then(() => {});
    });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      navigateFromNotificationData(response.notification.request.content.data as Record<string, unknown>);
    });
    return () => sub.remove();
  }, []);
}
