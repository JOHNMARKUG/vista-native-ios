import React, { useCallback, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ProfileStackParamList } from '../../navigation/types';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import VISTAButton from '../../components/VISTAButton';
import { colors, radius, shadows, spacing } from '../../lib/theme';

type Props = NativeStackScreenProps<ProfileStackParamList, 'Profile'>;

// Grouped-list background — the one screen in the app styled after
// Settings.app, so it intentionally uses systemGroupedBackground gray
// rather than the plain white every other screen sits on.
const GROUPED_BG = '#F2F2F7';

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
      <View style={{ flex: 1, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.md }}>
        <Ionicons name="person-circle-outline" size={64} color={colors.textSecondary} />
        <Text style={{ fontSize: 18, fontWeight: '700', color: colors.navy }}>You're browsing as a guest</Text>
        <Text style={{ fontSize: 14, color: colors.textSecondary, textAlign: 'center' }}>
          Sign in to save trips, earn points and get personalized support.
        </Text>
        <VISTAButton title="Sign In" variant="accent" fullWidth={false} onPress={exitGuestMode} />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: GROUPED_BG }}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: spacing.md, gap: spacing.lg, paddingBottom: spacing.xxl }}
    >
      <Group>
        <Pressable style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: spacing.md }}>
          <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 22, fontWeight: '700', color: colors.gold }}>
              {profile?.full_name?.[0]?.toUpperCase() ?? 'U'}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 17, fontWeight: '600', color: colors.textPrimary }}>{profile?.full_name ?? 'VISTA Traveler'}</Text>
            <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>{profile?.email ?? user?.email}</Text>
          </View>
        </Pressable>
      </Group>

      <Group>
        <MenuRow icon="star" iconColor={colors.gold} label="VISTA Points" value={String(points)} />
        <Divider />
        <MenuRow icon="gift-outline" iconColor={colors.navy} label="Refer a Friend" value="Earn UGX 10,000" onPress={handleShareReferral} />
      </Group>

      <Group>
        <MenuRow icon="person-outline" iconColor={colors.navy} label="Account Settings" onPress={() => navigation.navigate('Settings')} />
        <Divider />
        <MenuRow icon="card-outline" iconColor={colors.navy} label="Payment Methods" onPress={() => navigation.navigate('PaymentMethods')} />
        <Divider />
        <MenuRow icon="language-outline" iconColor={colors.navy} label="Language" onPress={() => navigation.navigate('Language')} />
        <Divider />
        <MenuRow
          icon="shield-checkmark-outline"
          iconColor={colors.navy}
          label="Privacy Policy"
          onPress={() => navigation.navigate('WebPage', { url: 'https://vista-customer.vercel.app/privacy-policy', title: 'Privacy Policy' })}
        />
        <Divider />
        <MenuRow
          icon="document-text-outline"
          iconColor={colors.navy}
          label="Terms of Service"
          onPress={() => navigation.navigate('WebPage', { url: 'https://vista-customer.vercel.app/terms-of-service', title: 'Terms of Service' })}
        />
      </Group>

      <Group>
        <Pressable
          onPress={handleSignOut}
          disabled={signingOut}
          style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 14 }}
        >
          <Text style={{ fontSize: 17, fontWeight: '400', color: colors.error }}>
            {signingOut ? 'Signing out...' : 'Sign Out'}
          </Text>
        </Pressable>
      </Group>
    </ScrollView>
  );
}

function Group({ children }: { children: React.ReactNode }) {
  return (
    <View style={[{ backgroundColor: colors.card, borderRadius: radius.card, overflow: 'hidden' }, shadows.card]}>
      {children}
    </View>
  );
}

function MenuRow({
  icon,
  iconColor,
  label,
  value,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  label: string;
  value?: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 12,
        paddingHorizontal: spacing.md,
        minHeight: 48,
      }}
    >
      <Ionicons name={icon} size={20} color={iconColor} />
      <Text style={{ flex: 1, fontSize: 16, color: colors.textPrimary }}>{label}</Text>
      {value ? <Text style={{ fontSize: 15, color: colors.textSecondary, marginRight: 4 }}>{value}</Text> : null}
      {onPress ? <Ionicons name="chevron-forward" size={16} color="#C7C7CC" /> : null}
    </Pressable>
  );
}

function Divider() {
  return <View style={{ height: 1, backgroundColor: colors.border, marginLeft: spacing.md + 32 }} />;
}
