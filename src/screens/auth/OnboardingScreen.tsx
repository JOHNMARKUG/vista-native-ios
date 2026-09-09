import React, { useRef, useState } from 'react';
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation/types';
import VISTAButton from '../../components/VISTAButton';
import { colors, spacing } from '../../lib/theme';

const ONBOARDED_KEY = 'vista_has_onboarded';
const { width } = Dimensions.get('window');

type Props = NativeStackScreenProps<AuthStackParamList, 'Onboarding'>;

export default function OnboardingScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const scrollRef = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);

  const slides = [
    {
      icon: 'airplane-outline' as const,
      title: t('onboarding.slide1Title'),
      body: t('onboarding.slide1Body'),
      bg: colors.navy,
      fg: '#FFFFFF',
      buttonVariant: 'accent' as const,
    },
    {
      icon: 'car-outline' as const,
      title: t('onboarding.slide2Title'),
      body: t('onboarding.slide2Body'),
      bg: '#FFFFFF',
      fg: colors.navy,
      buttonVariant: 'primary' as const,
    },
    {
      icon: 'map-outline' as const,
      title: t('onboarding.slide3Title'),
      body: t('onboarding.slide3Body'),
      bg: colors.navy,
      fg: '#FFFFFF',
      buttonVariant: 'accent' as const,
    },
  ];

  const current = slides[index];
  const isLast = index === slides.length - 1;
  const isDark = current.bg === colors.navy;

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    if (i !== index) setIndex(i);
  };

  const finish = async () => {
    await AsyncStorage.setItem(ONBOARDED_KEY, '1');
    navigation.replace('Login');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: current.bg }} edges={['top', 'bottom']}>
      <View style={{ alignItems: 'flex-end', paddingHorizontal: spacing.lg }}>
        {!isLast && (
          <Text
            onPress={finish}
            style={{
              color: isDark ? 'rgba(255,255,255,0.6)' : colors.textSecondary,
              fontSize: 15,
              fontWeight: '600',
              paddingVertical: 8,
            }}
          >
            {t('common.skip')}
          </Text>
        )}
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        style={{ flex: 1 }}
      >
        {slides.map((slide, i) => (
          <View
            key={i}
            style={{ width, backgroundColor: slide.bg, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl }}
          >
            <View
              style={{
                width: 96,
                height: 96,
                borderRadius: 48,
                backgroundColor: slide.bg === colors.navy ? 'rgba(255,255,255,0.12)' : 'rgba(27,46,107,0.08)',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: spacing.xl,
              }}
            >
              <Ionicons name={slide.icon} size={48} color={slide.bg === colors.navy ? colors.gold : colors.navy} />
            </View>
            <Text style={{ color: slide.fg, fontSize: 26, fontWeight: '700', textAlign: 'center', marginBottom: spacing.sm }}>
              {slide.title}
            </Text>
            <Text
              style={{
                color: slide.bg === colors.navy ? 'rgba(255,255,255,0.7)' : colors.textSecondary,
                fontSize: 15,
                textAlign: 'center',
                lineHeight: 22,
              }}
            >
              {slide.body}
            </Text>
          </View>
        ))}
      </ScrollView>

      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: spacing.xl }}>
        {slides.map((_, i) => (
          <View
            key={i}
            style={{
              width: i === index ? 22 : 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: i === index ? colors.gold : isDark ? 'rgba(255,255,255,0.25)' : colors.border,
            }}
          />
        ))}
      </View>

      <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.md }}>
        <VISTAButton
          title={isLast ? t('onboarding.getStarted') : t('common.next')}
          variant={current.buttonVariant}
          onPress={() => {
            if (isLast) {
              finish();
            } else {
              scrollRef.current?.scrollTo({ x: (index + 1) * width, animated: true });
              setIndex(index + 1);
            }
          }}
        />
      </View>
    </SafeAreaView>
  );
}
