import React, { useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown, SlideInDown } from 'react-native-reanimated';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../../navigation/types';
import { useAuth } from '../../context/AuthContext';
import ServiceCard from '../../components/ServiceCard';
import VISTAButton from '../../components/VISTAButton';
import AnimatedPressable from '../../components/AnimatedPressable';
import { colors, radius, shadows, spacing } from '../../lib/theme';

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
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: spacing.md, paddingBottom: 110 }}
      >
        <Animated.View entering={FadeInDown.duration(400)} style={{ marginBottom: spacing.lg }}>
          <Text style={{ fontSize: 20, fontWeight: '700', color: colors.textPrimary }}>
            {greeting}, {firstName}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
            <Ionicons name="location" size={14} color={colors.textSecondary} />
            <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{t('home.locationLabel')}</Text>
          </View>
        </Animated.View>

        <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: spacing.sm }}>
          {t('home.services')}
        </Text>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          <ServiceCard
            index={0}
            icon="business-outline"
            label={t('home.servicePilgrimage')}
            sublabel={t('home.servicePilgrimageSub')}
            onPress={() => requireAuth(() => navigation.navigate('PilgrimagePackage'))}
          />
          <ServiceCard
            index={1}
            icon="car-outline"
            label={t('home.serviceRides')}
            sublabel={t('home.serviceRidesSub')}
            onPress={() => requireAuth(() => navigation.navigate('VistaRides'))}
          />
          <ServiceCard
            index={2}
            icon="airplane-outline"
            label={t('home.serviceAirport')}
            sublabel={t('home.serviceAirportSub')}
            onPress={() => requireAuth(() => navigation.navigate('AirportTransfer'))}
          />
          <ServiceCard
            index={3}
            icon="time-outline"
            label={t('home.serviceHourly')}
            sublabel={t('home.serviceHourlySub')}
            onPress={() => requireAuth(() => Alert.alert(t('home.serviceHourly'), t('home.serviceHourlyComingSoon')))}
          />
        </View>

        <Animated.View
          entering={FadeInDown.delay(280).springify().damping(18)}
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
        </Animated.View>

        <AnimatedPressable
          onPress={openWhatsApp}
          entering={FadeInDown.delay(340).springify().damping(18)}
          style={[
            {
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.md,
              marginTop: spacing.lg,
              padding: spacing.md,
              borderRadius: radius.card,
              backgroundColor: colors.card,
            },
            shadows.card,
          ]}
        >
          <Ionicons name="logo-whatsapp" size={22} color={colors.textSecondary} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary }}>{t('home.needHelp')}</Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary }}>{t('home.whatsappAnytime')}</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
        </AnimatedPressable>
      </ScrollView>

      {showLoginPrompt && (
        <Animated.View
          entering={FadeIn.duration(180)}
          style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <Pressable
            onPress={() => setShowLoginPrompt(false)}
            style={{ flex: 1, justifyContent: 'flex-end' }}
          >
            <Animated.View entering={SlideInDown.springify().damping(20).stiffness(180)}>
              <Pressable
                onPress={(e) => e.stopPropagation()}
                style={{
                  backgroundColor: colors.card,
                  borderTopLeftRadius: radius.card * 1.5,
                  borderTopRightRadius: radius.card * 1.5,
                  padding: spacing.lg,
                  paddingBottom: spacing.xl,
                }}
              >
                <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: spacing.md }} />
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
            </Animated.View>
          </Pressable>
        </Animated.View>
      )}
    </View>
  );
}
