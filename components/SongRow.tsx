// components/SongRow.tsx
import GripIcon from '@/assets/svgs/grip.svg'; // 3-line icon
import type { Song } from '@/src/data/songs';
import { useAppTheme } from '@/src/theme/AppTheme';
import { cardStyles, textStyles } from '@/src/theme/styles';
import { spacing } from '@/src/theme/tokens';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type SongRowProps = {
  song: Song;
  index: number;
  drag?: () => void; // NEW: provided by DraggableFlatList
  isActive?: boolean; // NEW: true while dragging
  disableDrag?: boolean; // NEW: optional (e.g., while searching)
};

export const SongRow = ({
  song,
  index,
  drag,
  isActive,
  disableDrag,
}: SongRowProps) => {
  const { colors } = useAppTheme();
  const router = useRouter();
  const isEven = index % 2 === 0;

  return (
    <Pressable
      onPress={() => router.push(`/song/${song.id}`)}
      style={({ pressed }) => [
        cardStyles.songRow,
        {
          backgroundColor: isEven ? 'transparent' : colors.greenLight,
          opacity: isActive ? 0.9 : pressed ? 0.85 : 1,
          flexDirection: 'row',
          alignItems: 'stretch',
          justifyContent: 'flex-start',
          flex: 1,
        },
      ]}
    >
      {/* GRIP HANDLE */}
      <View style={styles.gripWrapper}>
        <Pressable
          onLongPress={disableDrag || !drag ? undefined : drag}
          delayLongPress={120}
          disabled={disableDrag || !drag}
          hitSlop={8}
          style={styles.gripTouch}
        >
          <GripIcon width={18} height={18} color={colors.primary} />
        </Pressable>
      </View>

      {/* 1. TITLE */}
      <View
        style={[
          styles.textWrapper,
          styles.first,
          { flexDirection: 'column', justifyContent: 'center' },
        ]}
      >
        <Text style={[textStyles.bodyBold, { color: colors.primary }]}>
          {song.title}
        </Text>
        <Text style={[textStyles.label, { color: colors.primary }]}>
          {song.artist}
        </Text>
      </View>

      {/* 2. SONG START */}
      <View
        style={[
          styles.textWrapper,
          { flexDirection: 'column', justifyContent: 'center' },
        ]}
      >
        <Text style={[textStyles.bodyBold, { color: colors.primary }]}>
          Song start
        </Text>
        <Text style={[textStyles.label, { color: colors.primary }]}>
          {song.songStart}
        </Text>
      </View>

      {/* 3. CHORDS */}
      <View
        style={[
          styles.textWrapper,
          { flexDirection: 'column', justifyContent: 'center' },
        ]}
      >
        <Text style={[textStyles.bodyBold, { color: colors.primary }]}>
          Chords
        </Text>
        <Text style={[textStyles.label, { color: colors.primary }]}>
          {song.chords}
        </Text>
      </View>

      {/* 4. SONG END */}
      <View
        style={[
          styles.textWrapper,
          styles.last,
          { flexDirection: 'column', justifyContent: 'center' },
        ]}
      >
        <Text style={[textStyles.bodyBold, { color: colors.primary }]}>
          Song end
        </Text>
        <Text style={[textStyles.label, { color: colors.primary }]}>
          {song.songEnd}
        </Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  gripWrapper: {
    alignSelf: 'stretch',
  },
  gripTouch: {
    flex: 1,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textWrapper: {
    flex: 1,
    marginHorizontal: 25,
    gap: spacing.xs,
  },
  first: {
    marginLeft: 0,
  },
  last: {
    marginRight: 0,
  },
});
