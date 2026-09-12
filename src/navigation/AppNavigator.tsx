import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useAuth } from '../context/AuthContext';
import { usePushNotifications } from '../hooks/usePushNotifications';
import LoadingScreen from '../components/LoadingScreen';
import { colors } from '../lib/theme';

import AuthNavigator from './AuthNavigator';
import TabNavigator from './TabNavigator';
import CompleteProfileScreen from '../screens/auth/CompleteProfileScreen';
import { navigationRef } from './navigationRef';

const NAV_THEME = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.background,
    primary: colors.navy,
    card: colors.card,
  },
};

const ProfileGate = createNativeStackNavigator();

export default function AppNavigator() {
  const { loading, session, profile, isGuest } = useAuth();
  usePushNotifications(session?.user?.id);

  if (loading) return <LoadingScreen />;
  // Session exists but the profile row hasn't loaded yet — treat as still loading
  // rather than flashing the tab bar before we know profile_complete.
  if (session && profile === null) return <LoadingScreen />;

  const needsProfile = !!session && profile !== null && profile.profile_complete === false;
  const canEnterApp = (!!session && !needsProfile) || (isGuest && !session);

  return (
    <NavigationContainer ref={navigationRef} theme={NAV_THEME}>
      {needsProfile ? (
        <ProfileGate.Navigator screenOptions={{ headerShown: false }}>
          <ProfileGate.Screen name="CompleteProfile" component={CompleteProfileScreen} />
        </ProfileGate.Navigator>
      ) : canEnterApp ? (
        <TabNavigator />
      ) : (
        <AuthNavigator />
      )}
    </NavigationContainer>
  );
}
