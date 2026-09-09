import React, { useCallback, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
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
  const [signingOut, setSigningOut] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      supabase
        .from('points_transactions')
        .select('points')
        .eq('user_id', user.id)
        .then(({ data }) => setPoints((data ?? []).reduce((sum: number, row: any) => sum + (row.points ?? 0), 0)));
    }, [user])
  );

  const handleShareReferral = () => {
    if (!profile?.referral_code) {
      Alert.alert('Refer a Friend', 'Your referral code will appear here once your profile finishes setting up.');
      return;
    }
    const msg = encodeURIComponent(
      `I use VISTA Transport for my rides in Uganda.\n\nDownload the app and use my code *${profile.referral_code}* to get UGX 10,000 off your first booking!`
    );
    Linking.openURL(`https://wa.me/?text=${msg}`);
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
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }} edges={['top']}>
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
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }} edges={['top']}>
      <View style={{ backgroundColor: colors.navy, paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.xl }}>
        <View style={{ alignItems: 'center', gap: 10 }}>
          <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 28, fontWeight: '700', color: colors.navy }}>
              {profile?.full_name?.[0]?.toUpperCase() ?? 'U'}
            </Text>
          </View>
          <Text style={{ fontSize: 19, fontWeight: '700', color: '#FFFFFF' }}>{profile?.full_name ?? 'VISTA Traveler'}</Text>
          <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>{profile?.email ?? user?.email}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xxl }}>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <VISTACard style={{ flex: 1, alignItems: 'center', gap: 4 }}>
            <Ionicons name="star" size={20} color={colors.gold} />
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.navy }}>{points}</Text>
            <Text style={{ fontSize: 11, color: colors.textSecondary }}>VISTA Points</Text>
          </VISTACard>
          <Pressable onPress={handleShareReferral} style={{ flex: 1 }}>
            <VISTACard style={{ alignItems: 'center', gap: 4 }}>
              <Ionicons name="gift-outline" size={20} color={colors.navy} />
              <Text style={{ fontSize: 13, fontWeight: '700', color: colors.navy }}>Refer a Friend</Text>
              <Text style={{ fontSize: 11, color: colors.textSecondary }}>Earn UGX 10,000</Text>
            </VISTACard>
          </Pressable>
        </View>

        <VISTACard style={{ padding: 0 }}>
          <MenuRow icon="person-outline" label="Account Settings" onPress={() => navigation.navigate('Settings')} />
          <Divider />
          <MenuRow icon="card-outline" label="Payment Methods" onPress={() => Alert.alert('Coming soon', 'Manage saved payment methods here soon.')} />
          <Divider />
          <MenuRow icon="language-outline" label="Language" onPress={() => navigation.navigate('Language')} />
          <Divider />
          <MenuRow
            icon="shield-checkmark-outline"
            label="Privacy Policy"
            onPress={() => Linking.openURL('https://vista-customer.vercel.app/privacy-policy')}
          />
          <Divider />
          <MenuRow
            icon="document-text-outline"
            label="Terms of Service"
            onPress={() => Linking.openURL('https://vista-customer.vercel.app/terms-of-service')}
            last
          />
        </VISTACard>

        <VISTACard style={{ padding: 0 }}>
          <Pressable
            onPress={handleSignOut}
            disabled={signingOut}
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16 }}
          >
            <Ionicons name="log-out-outline" size={18} color={colors.error} />
            <Text style={{ fontSize: 15, fontWeight: '600', color: colors.error }}>
              {signingOut ? 'Signing out...' : 'Sign Out'}
            </Text>
          </Pressable>
        </VISTACard>
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
  return <View style={{ height: 1, backgroundColor: colors.border, marginLeft: spacing.md + 32 }} />;
}
