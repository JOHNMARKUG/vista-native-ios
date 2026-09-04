import React, { useEffect, useState } from 'react';
import { Image, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../../navigation/types';
import { useAuth } from '../../context/AuthContext';
import { usePricing } from '../../lib/usePricing';
import { supabase } from '../../lib/supabase';
import ServiceCard from '../../components/ServiceCard';
import VISTAButton from '../../components/VISTAButton';
import { colors, spacing } from '../../lib/theme';

type Props = NativeStackScreenProps<HomeStackParamList, 'Home'>;

const WHATSAPP_NUMBER = '256785585703';

export default function HomeScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { user, profile, isGuest, exitGuestMode } = useAuth();
  const prices = usePricing();
  const [stats, setStats] = useState({ onlineDrivers: 0, totalTrips: 0 });
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? t('home.goodMorning') : hour < 17 ? t('home.goodAfternoon') : t('home.goodEvening');
  const firstName = profile?.full_name?.split(' ')[0] || 'Visitor';

  useEffect(() => {
    const fetchStats = async () => {
      const [{ count: online }, { count: trips }] = await Promise.all([
        supabase.from('drivers').select('*', { count: 'exact', head: true }).eq('is_online', true).eq('status', 'approved'),
        supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
      ]);
      setStats({ onlineDrivers: online ?? 0, totalTrips: trips ?? 0 });
    };
    fetchStats();
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleBook = (screen: 'PilgrimagePackage' | 'VistaRides' | 'AirportTransfer') => {
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
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 110 }}>
        <SafeAreaView edges={['top']} style={{ backgroundColor: colors.navy }}>
          <View style={{ paddingHorizontal: spacing.md, paddingBottom: spacing.lg }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Image source={require('../../../assets/vista-logo.png')} style={{ width: 26, height: 26, resizeMode: 'contain' }} />
                <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 13, letterSpacing: 2 }}>VISTA</Text>
              </View>
              <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: colors.navy, fontWeight: '800', fontSize: 16 }}>{firstName[0]?.toUpperCase() ?? 'U'}</Text>
              </View>
            </View>

            <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 28, fontWeight: '700' }}>{greeting},</Text>
            <Text style={{ color: '#FFFFFF', fontSize: 28, fontWeight: '700', marginBottom: 6 }}>{firstName}</Text>
            <Text style={{ color: colors.gold, fontSize: 12, fontWeight: '600', marginBottom: spacing.md }}>
              {t('home.transportReady')}
            </Text>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <StatChip icon="shield-checkmark" value={stats.onlineDrivers > 0 ? String(stats.onlineDrivers) : '—'} label={t('home.driversOnline')} />
              <StatChip icon="people" value={stats.totalTrips > 0 ? stats.totalTrips.toLocaleString() : '—'} label={t('home.tripsCompleted')} />
              <StatChip icon="star" value="4.9" label={t('home.avgRating')} />
            </View>
          </View>
        </SafeAreaView>

        <View style={{ padding: spacing.md, paddingTop: spacing.lg }}>
          {/* Pilgrimage hero card */}
          <View style={{ backgroundColor: colors.navy, borderTopWidth: 3, borderTopColor: colors.gold, borderRadius: 18, padding: 18, marginBottom: spacing.lg }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 14 }}>
              <View style={{ width: 44, height: 44, borderRadius: 13, backgroundColor: 'rgba(200,146,42,0.18)', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="business" size={22} color={colors.gold} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '700' }}>{t('home.pilgrimagePackage')}</Text>
                <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 2 }}>{t('home.pilgrimagePackageSub')}</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
              <Text style={{ color: colors.gold, fontSize: 26, fontWeight: '800' }}>USD {prices.pilgrimage_package}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>{t('home.perPerson')}</Text>
            </View>
            <VISTAButton
              title={t('home.bookPackage')}
              variant="accent"
              icon={<Ionicons name="arrow-forward" size={15} color={colors.navy} />}
              onPress={() => handleBook('PilgrimagePackage')}
            />
          </View>

          <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.sm }}>
            {t('home.services')}
          </Text>

          <View style={{ flexDirection: 'row', gap: 10, marginBottom: spacing.lg }}>
            <ServiceCard
              icon="car"
              label={t('home.serviceRides')}
              sublabel={t('home.serviceRidesSub')}
              badge="POPULAR"
              onPress={() => handleBook('VistaRides')}
            />
            <ServiceCard
              icon="airplane"
              label={t('home.serviceAirport')}
              sublabel={t('home.serviceAirportSub')}
              onPress={() => handleBook('AirportTransfer')}
            />
            <ServiceCard
              icon="business"
              label={t('home.servicePilgrimage')}
              sublabel={t('home.servicePilgrimageSub')}
              accent
              onPress={() => handleBook('PilgrimagePackage')}
            />
          </View>

          <Pressable
            onPress={openWhatsApp}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card, borderRadius: 13, padding: 14 }}
          >
            <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(26,107,60,0.1)', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="logo-whatsapp" size={18} color="#1A6B3C" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: colors.navy }}>{t('home.needHelp')}</Text>
              <Text style={{ fontSize: 11, color: colors.textSecondary }}>{t('home.whatsappAnytime')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#C5CEDC" />
          </Pressable>
        </View>
      </ScrollView>

      {showLoginPrompt && (
        <Pressable
          onPress={() => setShowLoginPrompt(false)}
          style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: spacing.lg }}
        >
          <Pressable onPress={(e) => e.stopPropagation()} style={{ backgroundColor: colors.card, borderRadius: 22, padding: 24, width: '100%', alignItems: 'center' }}>
            <Image source={require('../../../assets/vista-logo.png')} style={{ width: 52, height: 52, resizeMode: 'contain', marginBottom: 16 }} />
            <Text style={{ fontSize: 20, fontWeight: '800', color: colors.navy, marginBottom: 8 }}>{t('home.loginToBook')}</Text>
            <Text style={{ fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: 24 }}>
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

function StatChip({ icon, value, label }: { icon: keyof typeof Ionicons.glyphMap; value: string; label: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.09)', borderRadius: 12, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Ionicons name={icon} size={16} color={colors.gold} />
      <View>
        <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '800' }}>{value}</Text>
        <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 9, marginTop: 2 }}>{label}</Text>
      </View>
    </View>
  );
}
