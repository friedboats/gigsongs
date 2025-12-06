import ArrowLeftIcon from '@/assets/svgs/arrowLeft.svg';
import { ThemeToggleButton } from '@/components/ThemeToggleButton';
import { mockSongs } from '@/src/data/songs';
import { useAppTheme } from '@/src/theme/AppTheme';
import { textStyles } from '@/src/theme/styles';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

// Step 1 temporary mock lyrics
const MOCK_LYRICS = `This is a sample lyric line.
Tap here and type to edit these lyrics.
Blank lines also work.

Later, chords will appear above lyric rows.
But for now, this is just clean editable text.`;

export default function SongScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const { colors } = useAppTheme();

  const song = mockSongs.find((s) => s.id === id);

  const [lyrics, setLyrics] = useState(MOCK_LYRICS);

  if (!song) {
    return (
      <View style={styles.notFoundWrapper}>
        <Text style={{ fontSize: 20, marginBottom: 16, color: colors.primary }}>
          Song not found
        </Text>

        <Pressable
          onPress={() => router.back()}
          style={[
            styles.backButton,
            { backgroundColor: colors.primary, flexDirection: 'row', gap: 8 },
          ]}
        >
          <ArrowLeftIcon width={18} height={18} color={colors.white} />
          <Text style={[styles.backButtonText, { color: colors.white }]}>
            Back
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.white }}>
      {/* HEADER (unchanged) */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 40,
          paddingVertical: 40,
          width: '100%',
        }}
      >
        <Pressable
          onPress={() => router.back()}
          style={[
            styles.backButton,
            {
              backgroundColor: colors.greenLight,
              flexDirection: 'row',
              gap: 8,
            },
          ]}
        >
          <ArrowLeftIcon width={18} height={18} color={colors.primary} />
          <Text style={[styles.backButtonText, { color: colors.primary }]}>
            Back
          </Text>
        </Pressable>

        <View style={{ flex: 1, alignItems: 'center', gap: 4 }}>
          <Text
            style={[textStyles.heading2, { color: colors.primary }]}
            numberOfLines={1}
          >
            {song.title}
          </Text>
          <Text
            style={[textStyles.heading4, { color: colors.primary }]}
            numberOfLines={1}
          >
            {song.artist}
          </Text>
        </View>

        <ThemeToggleButton />
      </View>

      {/* STEP 1: CLEAN EDITABLE LYRICS */}
      <ScrollView
        contentContainerStyle={styles.lyricsContainer}
        keyboardShouldPersistTaps="handled"
      >
        <TextInput
          multiline
          value={lyrics}
          onChangeText={setLyrics}
          style={[
            styles.lyricsText,
            {
              color: colors.neutral,
              backgroundColor: 'transparent',
            },
          ]}
          placeholder="Type or paste your lyrics..."
          placeholderTextColor={colors.neutralMedium}
          underlineColorAndroid="transparent"
          autoCapitalize="sentences"
          autoCorrect
          textAlignVertical="top"
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  notFoundWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 40,
  },

  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },

  backButtonText: {
    fontSize: 18,
  },

  lyricsContainer: {
    paddingHorizontal: 40,
    paddingBottom: 80,
  },

  lyricsText: {
    fontSize: 18,
    lineHeight: 28,
    padding: 0,
    margin: 0,
    borderWidth: 0,
    includeFontPadding: false,
  },
});
