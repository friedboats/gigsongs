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
};

export const SongRow = ({ song, index }: SongRowProps) => {
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
          opacity: pressed ? 0.85 : 1,
          flexDirection: 'row',
          alignItems: 'flex-start',
          justifyContent: 'flex-start',
          flex: 1,
        },
      ]}
    >
      {/* 1. TITLE */}
      <View style={[styles.textWrapper, styles.first]}>
        <Text style={[textStyles.bodyBold, { color: colors.primary }]}>
          {song.title}
        </Text>
        <Text style={[textStyles.label, { color: colors.primary }]}>
          {song.artist}
        </Text>
      </View>

      {/* 2. SONG START */}
      <View style={styles.textWrapper}>
        <Text style={[textStyles.bodyBold, { color: colors.primary }]}>
          Song start
        </Text>
        <Text style={[textStyles.label, { color: colors.primary }]}>
          {song.songStart}
        </Text>
      </View>

      {/* 3. CHORDS */}
      <View style={styles.textWrapper}>
        <Text style={[textStyles.bodyBold, { color: colors.primary }]}>
          Chords
        </Text>
        <Text style={[textStyles.label, { color: colors.primary }]}>
          {song.chords}
        </Text>
      </View>

      {/* 4. SONG END */}
      <View style={[styles.textWrapper, styles.last]}>
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
