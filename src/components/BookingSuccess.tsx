import React, { useEffect } from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import VISTAButton from './VISTAButton';
import { colors, radius, spacing } from '../lib/theme';

type Props = {
  title: string;
  message: string;
  reference: string;
  buttonLabel?: string;
  onDone: () => void;
};

/**
 * A booking confirmation is the emotional peak of using this app — often a
 * pilgrim's first trip abroad — so it gets a real moment instead of a
 * system Alert.alert(). One shared component so every booking flow
 * (pilgrimage, rides, airport transfer) confirms the same way.
 */
export default function BookingSuccess({ title, message, reference, buttonLabel = 'View My Trips', onDone }: Props) {
  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', padding: spacing.xl }}>
      <Animated.View
        entering={ZoomIn.springify().damping(11).stiffness(120)}
        style={{
          width: 96,
          height: 96,
          borderRadius: 48,
          backgroundColor: colors.navy,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: spacing.lg,
        }}
      >
        <Animated.View entering={ZoomIn.delay(180).springify().damping(9).stiffness(180)}>
          <Ionicons name="checkmark" size={48} color={colors.gold} />
        </Animated.View>
      </Animated.View>

      <Animated.Text
        entering={FadeInDown.delay(220).springify().damping(16)}
        style={{ fontSize: 24, fontWeight: '700', color: colors.navy, textAlign: 'center', marginBottom: 8 }}
      >
        {title}
      </Animated.Text>

      <Animated.Text
        entering={FadeInDown.delay(280).springify().damping(16)}
        style={{ fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 21, marginBottom: spacing.md, maxWidth: 320 }}
      >
        {message}
      </Animated.Text>

      <Animated.View
        entering={FadeInDown.delay(340).springify().damping(16)}
        style={{ backgroundColor: '#F2F2F7', borderRadius: radius.tag, paddingVertical: 8, paddingHorizontal: 16, marginBottom: spacing.xl }}
      >
        <Text style={{ fontSize: 13, fontWeight: '700', color: colors.navy, letterSpacing: 1 }}>{reference}</Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(400).springify().damping(16)} style={{ width: '100%' }}>
        <VISTAButton title={buttonLabel} variant="accent" onPress={onDone} />
      </Animated.View>
    </View>
  );
}
