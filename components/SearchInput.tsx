import { useAppTheme } from '@/src/theme/AppTheme';
import React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

type SearchInputProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
};

export function SearchInput({
  value,
  onChangeText,
  placeholder = 'Search',
}: SearchInputProps) {
  const { colors } = useAppTheme();

  return (
    <View
      style={[
        styles.container,
        {
          borderColor: colors.neutralMedium,
          backgroundColor: colors.white,
        },
      ]}
    >
      <View style={styles.iconWrapper}>
        <View
          style={[styles.iconCircle, { borderColor: colors.neutralMedium }]}
        />
        <View
          style={[styles.iconHandle, { backgroundColor: colors.neutralMedium }]}
        />
      </View>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        style={[
          styles.input,
          {
            color: colors.neutral,
            width: '100%',
            outlineStyle: 'solid',
            outlineWidth: 0,
            outlineColor: 'transparent',
          },
        ]}
        placeholder={placeholder}
        placeholderTextColor={colors.neutralMedium}
        autoCapitalize="none"
        autoCorrect={false}
        clearButtonMode="while-editing"
        underlineColorAndroid="transparent"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 40,
  },

  iconWrapper: {
    width: 22,
    height: 22,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Lens
  iconCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },

  // Handle – positioned at bottom-right, then rotated
  iconHandle: {
    position: 'absolute',
    width: 8,
    height: 2,
    borderRadius: 1,
    left: 13, // move out from circle edge
    top: 16, // sit just below/right of the lens
    transform: [{ rotate: '45deg' }],
  },

  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
  },
});
