import './global.css';
import './src/lib/i18n';

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';

import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <KeyboardProvider>
          <BottomSheetModalProvider>
            <AuthProvider>
              <StatusBar style="dark" />
              <AppNavigator />
            </AuthProvider>
          </BottomSheetModalProvider>
        </KeyboardProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
