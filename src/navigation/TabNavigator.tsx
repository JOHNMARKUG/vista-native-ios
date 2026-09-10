import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import type {
  AlertsStackParamList,
  HomeStackParamList,
  ProfileStackParamList,
  RootTabParamList,
  TripsStackParamList,
} from './types';
import { colors } from '../lib/theme';

import HomeScreen from '../screens/home/HomeScreen';
import PilgrimagePackageScreen from '../screens/home/PilgrimagePackageScreen';
import VistaRidesScreen from '../screens/home/VistaRidesScreen';
import AirportTransferScreen from '../screens/home/AirportTransferScreen';

import TripsScreen from '../screens/trips/TripsScreen';
import TripDetailScreen from '../screens/trips/TripDetailScreen';
import TrackingScreen from '../screens/trips/TrackingScreen';

import AlertsScreen from '../screens/alerts/AlertsScreen';

import ProfileScreen from '../screens/profile/ProfileScreen';
import SettingsScreen from '../screens/profile/SettingsScreen';
import LanguageScreen from '../screens/profile/LanguageScreen';

const Tab = createBottomTabNavigator<RootTabParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const TripsStack = createNativeStackNavigator<TripsStackParamList>();
const AlertsStack = createNativeStackNavigator<AlertsStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();

/**
 * Real native-stack headers (an actual UINavigationController on iOS) rather
 * than hand-rolled back-row views — correct large-title collapse-on-scroll,
 * correct blur, and correct swipe-back integration for free.
 */
const rootHeaderOptions = {
  headerLargeTitle: true,
  headerLargeTitleShadowVisible: false,
  headerTintColor: colors.navy,
  headerTitleStyle: { color: '#000000' },
  headerLargeTitleStyle: { color: '#000000' },
};

const pushedHeaderOptions = {
  headerTintColor: colors.navy,
  headerTitleStyle: { color: '#000000', fontSize: 17, fontWeight: '600' as const },
  headerBackTitle: 'Back',
  headerShadowVisible: true,
};

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator screenOptions={{ headerTintColor: colors.navy }}>
      <HomeStack.Screen name="Home" component={HomeScreen} options={{ title: 'VISTA Transport', ...rootHeaderOptions }} />
      <HomeStack.Screen name="PilgrimagePackage" component={PilgrimagePackageScreen} options={{ title: 'Pilgrimage Package', ...pushedHeaderOptions }} />
      <HomeStack.Screen name="VistaRides" component={VistaRidesScreen} options={{ title: 'VISTA Rides', ...pushedHeaderOptions }} />
      <HomeStack.Screen name="AirportTransfer" component={AirportTransferScreen} options={{ title: 'Airport Transfer', ...pushedHeaderOptions }} />
    </HomeStack.Navigator>
  );
}

function TripsStackNavigator() {
  return (
    <TripsStack.Navigator screenOptions={{ headerTintColor: colors.navy }}>
      <TripsStack.Screen name="Trips" component={TripsScreen} options={{ title: 'My Trips', ...rootHeaderOptions }} />
      <TripsStack.Screen name="TripDetail" component={TripDetailScreen} options={{ title: 'Trip Detail', ...pushedHeaderOptions }} />
      <TripsStack.Screen name="Tracking" component={TrackingScreen} options={{ title: 'Live Tracking', ...pushedHeaderOptions }} />
    </TripsStack.Navigator>
  );
}

function AlertsStackNavigator() {
  return (
    <AlertsStack.Navigator screenOptions={{ headerTintColor: colors.navy }}>
      <AlertsStack.Screen name="Alerts" component={AlertsScreen} options={{ title: 'Notifications', ...rootHeaderOptions }} />
    </AlertsStack.Navigator>
  );
}

function ProfileStackNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerTintColor: colors.navy }}>
      <ProfileStack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile', ...rootHeaderOptions }} />
      <ProfileStack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings', ...pushedHeaderOptions }} />
      <ProfileStack.Screen name="Language" component={LanguageScreen} options={{ title: 'Language', ...pushedHeaderOptions }} />
    </ProfileStack.Navigator>
  );
}

export default function TabNavigator() {
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.navy,
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: { position: 'absolute', borderTopWidth: 0.5, borderTopColor: '#E3E3E8' },
        tabBarBackground: () => (
          <BlurView intensity={90} tint="light" style={{ ...StyleSheetAbsoluteFill }} />
        ),
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStackNavigator}
        options={{
          title: t('tabs.home'),
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="TripsTab"
        component={TripsStackNavigator}
        options={{
          title: t('tabs.trips'),
          tabBarIcon: ({ color, size }) => <Ionicons name="car" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="AlertsTab"
        component={AlertsStackNavigator}
        options={{
          title: t('tabs.alerts'),
          tabBarIcon: ({ color, size }) => <Ionicons name="notifications" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStackNavigator}
        options={{
          title: t('tabs.profile'),
          tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

const StyleSheetAbsoluteFill = { position: 'absolute' as const, left: 0, right: 0, top: 0, bottom: 0 };
