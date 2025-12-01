import ClearCircle from '@/assets/svgs/clearCircle.svg';
import { useAppTheme } from '@/src/theme/AppTheme';
import React, { useRef } from 'react';
import {
  Pressable,
  TextInput as RNTextInput,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

type SearchInputProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
};

const CONTROL_HEIGHT = 48;

export function SearchInput({
  value,
  onChangeText,
  placeholder = 'Search',
}: SearchInputProps) {
  const { colors } = useAppTheme();
  const inputRef = useRef<RNTextInput>(null);
  const hasValue = value.length > 0;

  return (
    <Pressable
      onPress={() => {
        inputRef.current?.focus();
      }}
      style={[
        styles.container,
        {
          borderColor: colors.neutralMedium,
          backgroundColor: colors.white,
        },
      ]}
    >
      {/* Magnifier */}
      <View style={styles.iconWrapper}>
        <View
          style={[styles.iconCircle, { borderColor: colors.neutralMedium }]}
        />
        <View
          style={[styles.iconHandle, { backgroundColor: colors.neutralMedium }]}
        />
      </View>

      {/* Text Input */}
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={onChangeText}
        style={[
          styles.input,
          {
            color: colors.neutral,
            outlineStyle: 'solid',
            outlineWidth: 0,
            outlineColor: 'transparent',
          },
        ]}
        placeholder={placeholder}
        placeholderTextColor={colors.neutralMedium}
        autoCapitalize="none"
        autoCorrect={false}
        underlineColorAndroid="transparent"
      />

      {/* Clear Button */}
      {hasValue && (
        <Pressable
          onPress={() => {
            onChangeText('');
            // Immediately re-focus input after clearing
            requestAnimationFrame(() => inputRef.current?.focus());
          }}
          hitSlop={8}
          style={styles.clearButton}
        >
          <ClearCircle width={22} height={22} color={colors.neutralMedium} />
        </Pressable>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: CONTROL_HEIGHT,
  },

  iconWrapper: {
    width: 22,
    height: 22,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -2, // your 2px upward shift
  },

  iconCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },

  iconHandle: {
    position: 'absolute',
    width: 8,
    height: 2,
    borderRadius: 1,
    left: 13,
    top: 16,
    transform: [{ rotate: '45deg' }],
  },

  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
  },

  clearButton: {
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
