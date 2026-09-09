import React, { useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../../navigation/types';
import { useAuth } from '../../context/AuthContext';
import ServiceCard from '../../components/ServiceCard';
import VISTAButton from '../../components/VISTAButton';
import { colors, radius, spacing } from '../../lib/theme';

type Props = NativeStackScreenProps<HomeStackParamList, 'Home'>;

const WHATSAPP_NUMBER = '256785585703';

export default function HomeScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { user, profile, exitGuestMode } = useAuth();
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const firstName = profile?.full_name?.split(' ')[0] || 'there';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? t('home.goodMorning') : hour < 17 ? t('home.goodAfternoon') : t('home.goodEvening');

  const requireAuth = (action: () => void) => {
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }
    action();
  };

  const openWhatsApp = () => {
    const msg = encodeURIComponent('Hello VISTA Transport, I need help with my booking.');
    Linking.openURL(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.navy }}>
        <View style={{ paddingHorizontal: spacing.md, paddingBottom: spacing.lg, paddingTop: spacing.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#FFFFFF', fontSize: 22, fontWeight: '700' }}>
                {greeting}, {firstName}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 }}>
                <Ionicons name="location" size={14} color={colors.gold} />
                <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>{t('home.locationLabel')}</Text>
              </View>
            </View>
            <Pressable
              onPress={() => navigation.getParent()?.navigate('AlertsTab' as never)}
              hitSlop={10}
              style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' }}
            >
              <Ionicons name="notifications-outline" size={20} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: spacing.md, paddingBottom: 110 }}>
        <Text style={{ fontSize: 16, fontWeight: '700', color: colors.navy, marginBottom: spacing.sm }}>
          {t('home.services')}
        </Text>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          <ServiceCard
            icon="business-outline"
            label={t('home.servicePilgrimage')}
            sublabel={t('home.servicePilgrimageSub')}
            onPress={() => requireAuth(() => navigation.navigate('PilgrimagePackage'))}
          />
          <ServiceCard
            icon="car-outline"
            label={t('home.serviceRides')}
            sublabel={t('home.serviceRidesSub')}
            onPress={() => requireAuth(() => navigation.navigate('VistaRides'))}
          />
          <ServiceCard
            icon="airplane-outline"
            label={t('home.serviceAirport')}
            sublabel={t('home.serviceAirportSub')}
            onPress={() => requireAuth(() => navigation.navigate('AirportTransfer'))}
          />
          <ServiceCard
            icon="time-outline"
            label={t('home.serviceHourly')}
            sublabel={t('home.serviceHourlySub')}
            onPress={() => requireAuth(() => Alert.alert(t('home.serviceHourly'), t('home.serviceHourlyComingSoon')))}
          />
        </View>

        <View
          style={{
            backgroundColor: colors.navy,
            borderRadius: radius.card,
            padding: spacing.lg,
            marginTop: spacing.lg,
          }}
        >
          <Text style={{ color: '#FFFFFF', fontSize: 17, fontWeight: '700', lineHeight: 23, marginBottom: spacing.md }}>
            {t('home.featuredTitle')}
          </Text>
          <VISTAButton
            title={t('home.featuredButton')}
            variant="accent"
            onPress={() => requireAuth(() => navigation.navigate('PilgrimagePackage'))}
          />
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
