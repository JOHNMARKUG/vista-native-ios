import React, { useState } from 'react';
import { Image, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../../navigation/types';
import { useAuth } from '../../context/AuthContext';
import VISTAButton from '../../components/VISTAButton';
import { colors, radius, shadows, spacing } from '../../lib/theme';

type Props = NativeStackScreenProps<HomeStackParamList, 'Home'>;

const WHATSAPP_NUMBER = '256785585703';

const SERVICE_KEYS: {
  key: 'VistaRides' | 'AirportTransfer' | 'PilgrimagePackage';
  icon: keyof typeof Ionicons.glyphMap;
  labelKey: string;
  sublabelKey: string;
}[] = [
  { key: 'VistaRides', icon: 'car-outline', labelKey: 'home.serviceRides', sublabelKey: 'home.serviceRidesSub' },
  { key: 'AirportTransfer', icon: 'airplane-outline', labelKey: 'home.serviceAirport', sublabelKey: 'home.serviceAirportSub' },
  { key: 'PilgrimagePackage', icon: 'business-outline', labelKey: 'home.servicePilgrimage', sublabelKey: 'home.servicePilgrimageSub' },
];

export default function HomeScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { user, profile, exitGuestMode } = useAuth();
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const firstName = profile?.full_name?.split(' ')[0] || 'there';

  const handleBook = (screen: (typeof SERVICE_KEYS)[number]['key']) => {
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }
    navigation.navigate(screen);
  };

  const openWhatsApp = () => {
    const msg = encodeURIComponent('Hello VISTA Transport, I need help with my booking.');
    Linking.openURL(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.card }}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.navy }}>
        <View style={{ paddingHorizontal: spacing.md, paddingBottom: spacing.lg, paddingTop: spacing.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: spacing.md }}>
            <Image source={require('../../../assets/vista-logo.png')} style={{ width: 28, height: 28, resizeMode: 'contain' }} />
            <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 15 }}>VISTA Transport</Text>
          </View>
          <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>{t('home.welcomeBack')}</Text>
          <Text style={{ color: '#FFFFFF', fontSize: 22, fontWeight: '700' }}>{firstName}</Text>
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: spacing.md, paddingBottom: 110 }}>
        <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: spacing.sm }}>
          {t('home.services')}
        </Text>

        <View style={{ gap: spacing.sm }}>
          {SERVICE_KEYS.map((service) => (
            <Pressable
              key={service.key}
              onPress={() => handleBook(service.key)}
              style={({ pressed }) => [
                {
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.md,
                  backgroundColor: colors.card,
                  borderRadius: radius.card,
                  borderWidth: 1,
                  borderColor: colors.border,
                  padding: spacing.md,
                  opacity: pressed ? 0.85 : 1,
                },
                shadows.card,
              ]}
            >
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: radius.control,
                  backgroundColor: colors.navy,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name={service.icon} size={24} color={colors.background} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: colors.textPrimary }}>{t(service.labelKey)}</Text>
                <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>{t(service.sublabelKey)}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
            </Pressable>
          ))}
        </View>

        <Pressable
          onPress={openWhatsApp}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.md,
            marginTop: spacing.lg,
            padding: spacing.md,
            borderRadius: radius.card,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Ionicons name="logo-whatsapp" size={22} color={colors.textSecondary} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary }}>{t('home.needHelp')}</Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary }}>{t('home.whatsappAnytime')}</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
        </Pressable>
      </ScrollView>

      {showLoginPrompt && (
        <Pressable
          onPress={() => setShowLoginPrompt(false)}
          style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: spacing.lg }}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{ backgroundColor: colors.card, borderRadius: radius.card, padding: spacing.lg, width: '100%' }}
          >
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginBottom: 8 }}>
              {t('home.loginToBook')}
            </Text>
            <Text style={{ fontSize: 14, color: colors.textSecondary, lineHeight: 20, marginBottom: spacing.lg }}>
              {t('home.loginToBookBody')}
            </Text>
            <VISTAButton
              title={t('profile.signIn')}
              variant="accent"
              onPress={() => {
                setShowLoginPrompt(false);
                exitGuestMode();
              }}
            />
          </Pressable>
        </Pressable>
      )}
    </View>
  );
}
