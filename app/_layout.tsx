import { AppThemeProvider, useAppTheme } from '@/src/theme/AppTheme';
import {
  InriaSans_400Regular,
  InriaSans_700Bold,
  useFonts,
} from '@expo-google-fonts/inria-sans';
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';

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
    <ThemeProvider value={navTheme}>
      <Stack screenOptions={{ headerShown: false }} />
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    InriaSans: InriaSans_400Regular,
    InriaSansBold: InriaSans_700Bold,
  });

  if (!fontsLoaded) return null;

  return (
    <AppThemeProvider>
      <RootNavigation />
    </AppThemeProvider>
  );
}
