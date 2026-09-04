import React, { useCallback, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ProfileStackParamList } from '../../navigation/types';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import VISTAButton from '../../components/VISTAButton';
import VISTACard from '../../components/VISTACard';
import { colors, spacing } from '../../lib/theme';

type Props = NativeStackScreenProps<ProfileStackParamList, 'Profile'>;

export default function ProfileScreen({ navigation }: Props) {
  const { user, profile, isGuest, exitGuestMode, signOut } = useAuth();
  const [points, setPoints] = useState(0);
  const [referralCount, setReferralCount] = useState(0);
  const [signingOut, setSigningOut] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      supabase
        .from('points_transactions')
        .select('points')
        .eq('user_id', user.id)
        .then(({ data }) => setPoints((data ?? []).reduce((sum: number, row: any) => sum + (row.points ?? 0), 0)));
      supabase
        .from('referrals')
        .select('status')
        .eq('referrer_id', user.id)
        .then(({ data }) => setReferralCount((data ?? []).length));
    }, [user])
  );

  const handleShareReferral = () => {
    if (!profile?.referral_code) return;
    const msg = encodeURIComponent(
      `I use VISTA Transport for my rides in Uganda! 🚗\n\nDownload the app and use my code *${profile.referral_code}* to get UGX 10,000 off your first booking!`
    );
    Linking.openURL(`https://wa.me/?text=${msg}`);
  };

  const copyReferralCode = async () => {
    if (!profile?.referral_code) return;
    await Clipboard.setStringAsync(profile.referral_code);
  };

  const handleSignOut = () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          setSigningOut(true);
          await signOut();
          setSigningOut(false);
        },
      },
    ]);
  };

  if (isGuest && !user) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.md }}>
          <Ionicons name="person-circle-outline" size={64} color={colors.textSecondary} />
          <Text style={{ fontSize: 18, fontWeight: '700', color: colors.navy }}>You're browsing as a guest</Text>
          <Text style={{ fontSize: 14, color: colors.textSecondary, textAlign: 'center' }}>
            Sign in to save trips, earn points and get personalized support.
          </Text>
          <VISTAButton title="Sign In" variant="accent" fullWidth={false} onPress={exitGuestMode} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xxl }}>
        <View style={{ alignItems: 'center', gap: 10, paddingVertical: spacing.md }}>
          <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 28, fontWeight: '800', color: colors.gold }}>
              {profile?.full_name?.[0]?.toUpperCase() ?? 'U'}
            </Text>
          </View>
          <Text style={{ fontSize: 19, fontWeight: '700', color: colors.textPrimary }}>{profile?.full_name ?? 'VISTA Traveler'}</Text>
          <Text style={{ fontSize: 13, color: colors.textSecondary }}>{profile?.email ?? user?.email}</Text>
        </View>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <VISTACard style={{ flex: 1, alignItems: 'center', gap: 4 }}>
            <Ionicons name="star" size={20} color={colors.gold} />
            <Text style={{ fontSize: 18, fontWeight: '800', color: colors.navy }}>{points}</Text>
            <Text style={{ fontSize: 11, color: colors.textSecondary }}>VISTA Points</Text>
          </VISTACard>
          <VISTACard style={{ flex: 1, alignItems: 'center', gap: 4 }}>
            <Ionicons name="people" size={20} color={colors.navy} />
            <Text style={{ fontSize: 18, fontWeight: '800', color: colors.navy }}>{referralCount}</Text>
            <Text style={{ fontSize: 11, color: colors.textSecondary }}>Referrals</Text>
          </VISTACard>
        </View>

        {profile?.referral_code && (
          <VISTACard>
            <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textSecondary, marginBottom: 8 }}>YOUR REFERRAL CODE</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 20, fontWeight: '800', color: colors.navy, letterSpacing: 1 }}>{profile.referral_code}</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Pressable onPress={copyReferralCode} style={{ padding: 8 }}>
                  <Ionicons name="copy-outline" size={20} color={colors.navy} />
                </Pressable>
                <Pressable onPress={handleShareReferral} style={{ padding: 8 }}>
                  <Ionicons name="share-social-outline" size={20} color={colors.navy} />
                </Pressable>
              </View>
            </View>
          </VISTACard>
        )}

        <VISTACard style={{ padding: 0 }}>
          <MenuRow icon="person-outline" label="Edit Profile" onPress={() => Alert.alert('Coming soon', 'Profile editing is on the way.')} />
          <Divider />
          <MenuRow icon="card-outline" label="Payment Methods" onPress={() => Alert.alert('Coming soon', 'Manage saved payment methods here soon.')} />
          <Divider />
          <MenuRow icon="settings-outline" label="Settings" onPress={() => navigation.navigate('Settings')} last />
        </VISTACard>

        <VISTAButton title={signingOut ? 'Signing out...' : 'Sign Out'} variant="outline" loading={signingOut} onPress={handleSignOut} />
      </ScrollView>
    </SafeAreaView>
  );
}

function MenuRow({ icon, label, onPress, last }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void; last?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 14,
        paddingHorizontal: spacing.md,
      }}
    >
      <Ionicons name={icon} size={20} color={colors.navy} />
      <Text style={{ flex: 1, fontSize: 15, color: colors.textPrimary }}>{label}</Text>
      <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
    </Pressable>
  );
}

function Divider() {
  return <View style={{ height: 1, backgroundColor: colors.background, marginLeft: spacing.md + 32 }} />;
}
