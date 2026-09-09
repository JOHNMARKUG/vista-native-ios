import React, { useEffect } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation/types';
import { colors } from '../../lib/theme';
import { markSplashShown } from '../../lib/authFlowState';

const ONBOARDED_KEY = 'vista_has_onboarded';

type Props = NativeStackScreenProps<AuthStackParamList, 'Splash'>;

export default function SplashScreen({ navigation }: Props) {
  useEffect(() => {
    const timer = setTimeout(async () => {
      const hasOnboarded = await AsyncStorage.getItem(ONBOARDED_KEY);
      markSplashShown();
      navigation.replace(hasOnboarded ? 'Login' : 'Onboarding');
    }, 1200);
    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeIn.duration(400)} style={{ alignItems: 'center', gap: 16 }}>
        <Image source={require('../../../assets/vista-logo.png')} style={styles.logo} />
        <Text style={styles.wordmark}>VISTA Transport</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: { width: 88, height: 88, resizeMode: 'contain' },
  wordmark: { color: '#FFFFFF', fontSize: 17, fontWeight: '600' },
});
