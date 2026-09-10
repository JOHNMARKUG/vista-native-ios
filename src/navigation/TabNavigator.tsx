import React from 'react';
import { Image, Text, View } from 'react-native';
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
import PaymentMethodsScreen from '../screens/profile/PaymentMethodsScreen';
import WebPageScreen from '../screens/profile/WebPageScreen';

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

/**
 * The tab bar is absolutely positioned (for the blur effect), which means
 * React Navigation does NOT automatically hide it on screens pushed deeper
 * into a tab's stack — it floats on top of everything, including sticky
 * bottom buttons on those screens. Exported so useHideTabBar can restore
 * this exact style when a screen that hides it unmounts.
 */
export const VISIBLE_TAB_BAR_STYLE = { position: 'absolute' as const, borderTopWidth: 0.5, borderTopColor: '#E3E3E8' };

const pushedHeaderOptions = {
  headerTintColor: colors.navy,
  headerTitleStyle: { color: '#000000', fontSize: 17, fontWeight: '600' as const },
  headerBackTitle: 'Back',
  headerShadowVisible: true,
};

/**
 * A compact logotype header just for the Home tab, rather than the large
 * title used everywhere else — the mark itself does the branding job, so
 * the big typographic moment happens in-content (the greeting) instead of
 * being duplicated in the nav bar.
 */
function HomeHeaderTitle() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Image source={require('../../assets/vista-logo.png')} style={{ width: 22, height: 22, resizeMode: 'contain' }} />
      <Text style={{ fontSize: 17, fontWeight: '800', color: colors.navy, letterSpacing: 0.3 }}>VISTA</Text>
    </View>
  );
}

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator screenOptions={{ headerTintColor: colors.navy }}>
      <HomeStack.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'VISTA',
          headerLargeTitle: false,
          headerTitleAlign: 'left',
          headerTitle: HomeHeaderTitle,
          headerShadowVisible: true,
          headerTintColor: colors.navy,
        }}
      />
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
      <ProfileStack.Screen name="PaymentMethods" component={PaymentMethodsScreen} options={{ title: 'Payment Methods', ...pushedHeaderOptions }} />
      <ProfileStack.Screen
        name="WebPage"
        component={WebPageScreen}
        options={({ route }) => ({ title: route.params.title, ...pushedHeaderOptions })}
      />
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
        tabBarStyle: VISIBLE_TAB_BAR_STYLE,
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
