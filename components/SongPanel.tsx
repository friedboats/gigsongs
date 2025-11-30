// SongPanel.tsx
import PlusIcon from '@/assets/svgs/plus.svg';
import { useAppTheme } from '@/src/theme/AppTheme';
import { textStyles } from '@/src/theme/styles';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SearchInput } from './SearchInput';

type SongPanelProps = {
  query: string;
  onChangeQuery: (text: string) => void;
};

export const SongPanel = ({ query, onChangeQuery }: SongPanelProps) => {
  const { colors } = useAppTheme();

  return (
    <View style={styles.container}>
      {/* LEFT GROUP */}
      <View style={styles.leftGroup}>
        <Text
          style={[textStyles.heading2, { color: colors.primary }]}
          numberOfLines={1}
          ellipsizeMode="clip"
        >
          Your songs
        </Text>

        <View style={styles.searchWrapper}>
          <SearchInput value={query} onChangeText={onChangeQuery} />
        </View>
      </View>

      {/* RIGHT BUTTON */}
      <Pressable
        onPress={() => console.log('Create a new song')}
        style={[
          styles.createButton,
          {
            backgroundColor: colors.primary,
            alignContent: 'center',
            flexDirection: 'row',
            gap: 8,
          },
        ]}
      >
        <PlusIcon width={18} height={18} color={colors.white} />
        <Text style={[styles.createButtonText, { color: colors.white }]}>
          Create a new song
        </Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 48,
  },

  leftGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 48,
  },

  searchWrapper: {
    flex: 1,
  },

  createButton: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },

  createButtonText: {
    fontSize: 18,
  },
});
