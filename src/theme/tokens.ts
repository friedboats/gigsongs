// src/theme/tokens.ts

export const colors = {
  light: {
    white: '#FFFFFF',
    black: '#000000',
    neutral: '#393939',
    neutralMedium: '#A0A0A0',
    primary: '#002E17',
    greenLight: '#E6ECE2',
    red: '#B40000',
    greenLime: '#158D00',
  },

  dark: {
    white: '#FFFFFF',
    black: '#000000',
    neutral: '#393939',
    neutralMedium: '#A0A0A0',
    primary: '#002E17',
    greenLight: '#E6ECE2',
    red: '#B40000',
    greenLime: '#158D00',
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 40,
};

export const radii = {
  sm: 4,
  md: 8, // primary radius
  lg: 12,
  pill: 999,
};

export const typography = {
  fontFamily: 'InriaSans',
  fontFamilyBold: 'InriaSansBold',
  sizes: {
    xs: 14,
    sm: 16,
    md: 18,
    lg: 22,
    xl: 28,
    xxl: 36,
    xxxl: 96,
  },

  weights: {
    regular: '400' as const,
    bold: '700' as const,
  },
};
