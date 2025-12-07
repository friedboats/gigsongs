import { AppThemeProvider, useAppTheme } from '@/src/theme/AppTheme';
import {
  InriaSans_400Regular,
  InriaSans_700Bold,
  useFonts,
} from '@expo-google-fonts/inria-sans';
import {
  OverpassMono_400Regular,
  OverpassMono_700Bold,
} from '@expo-google-fonts/overpass-mono';
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

function RootNavigation() {
  const { mode, colors } = useAppTheme();

  const baseTheme = mode === 'dark' ? DarkTheme : DefaultTheme;
  const navTheme = {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      background: colors.white,
    },
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={navTheme}>
        <Stack screenOptions={{ headerShown: false }} />
        <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    InriaSans: InriaSans_400Regular,
    InriaSansBold: InriaSans_700Bold,
    OverpassMono: OverpassMono_400Regular,
    OverpassMonoBold: OverpassMono_700Bold,
  });

  if (!fontsLoaded) return null;

  return (
    <AppThemeProvider>
      <RootNavigation />
    </AppThemeProvider>
  );
}
