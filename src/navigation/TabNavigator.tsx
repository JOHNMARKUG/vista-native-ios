import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import type {
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
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="Home" component={HomeScreen} />
      <HomeStack.Screen name="PilgrimagePackage" component={PilgrimagePackageScreen} />
      <HomeStack.Screen name="VistaRides" component={VistaRidesScreen} />
      <HomeStack.Screen name="AirportTransfer" component={AirportTransferScreen} />
    </HomeStack.Navigator>
  );
}

function TripsStackNavigator() {
  return (
    <TripsStack.Navigator screenOptions={{ headerShown: false }}>
      <TripsStack.Screen name="Trips" component={TripsScreen} />
      <TripsStack.Screen name="TripDetail" component={TripDetailScreen} />
      <TripsStack.Screen name="Tracking" component={TrackingScreen} />
    </TripsStack.Navigator>
  );
}

function ProfileStackNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="Profile" component={ProfileScreen} />
      <ProfileStack.Screen name="Settings" component={SettingsScreen} />
      <ProfileStack.Screen name="Language" component={LanguageScreen} />
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
        component={AlertsScreen}
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
