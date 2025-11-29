import { useAppTheme } from '@/src/theme/AppTheme';
import { textStyles } from '@/src/theme/styles';
import { typography } from '@/src/theme/tokens';
import React from 'react';
import { Text, View, useWindowDimensions } from 'react-native';

export function MainHeader() {
  const { width } = useWindowDimensions();
  const { colors } = useAppTheme();

  const baseSize = typography.sizes.xxxl;
  const minSize = 40;

  const fontSize =
    width >= baseSize * 4
      ? baseSize
      : Math.max(minSize, (width / (baseSize * 4)) * baseSize);

  return (
    <View
      style={{
        paddingVertical: 90,
        paddingHorizontal: 80,
        alignItems: 'center',
        width: '100%',
      }}
    >
      <Text
        style={[
          textStyles.bodyBold,
          {
            fontSize,
            color: colors.primary,
          },
        ]}
      >
        GigSongs
      </Text>
    </View>
  );
}
