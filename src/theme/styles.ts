import { StyleSheet } from 'react-native';
import { radii, spacing, typography } from './tokens';

/**
 * IMPORTANT:
 * No colors here. Colors come from useAppTheme().
 * Styles here combine typography + spacing + layout only.
 */

export const textStyles = StyleSheet.create({
  body: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.sm,
  },
  bodyBold: {
    fontFamily: typography.fontFamilyBold,
    fontSize: typography.sizes.sm,
  },
  label: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.xs,
    letterSpacing: 0.3,
  },
  heading1: {
    fontFamily: typography.fontFamilyBold,
    fontSize: typography.sizes.xxxl,
  },
  heading2: {
    fontFamily: typography.fontFamilyBold,
    fontSize: typography.sizes.xl,
    letterSpacing: 0,
  },
  heading3: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.xl,
  },
  heading4: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.lg,
  },
  heading5: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.md,
  },
});

export const cardStyles = StyleSheet.create({
  songRow: {
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
  },
});

export const buttonStyles = StyleSheet.create({
  primary: {
    borderRadius: radii.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: typography.sizes.md,
  },
  primaryText: {
    fontFamily: typography.fontFamilyBold,
    fontSize: typography.sizes.sm,
  },
  ghost: {
    borderRadius: radii.md,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  ghostText: {
    fontFamily: typography.fontFamilyBold,
    fontSize: typography.sizes.sm,
  },
});
