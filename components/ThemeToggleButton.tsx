// components/ThemeToggleButton.tsx
import MoonIcon from '@/assets/svgs/moon.svg';
import SunIcon from '@/assets/svgs/sun.svg';
import { useAppTheme } from '@/src/theme/AppTheme';
import React from 'react';
import { Pressable } from 'react-native';

export function ThemeToggleButton() {
  const { mode, toggleMode, colors } = useAppTheme();
  const Icon = mode === 'light' ? MoonIcon : SunIcon;

  return (
    <Pressable
      onPress={toggleMode}
      style={{
        padding: 12,
        borderRadius: 999,
        backgroundColor: colors.greenLight,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icon width={32} height={32} color={colors.primary} />
    </Pressable>
  );
}
