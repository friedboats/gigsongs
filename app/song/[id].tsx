import ArrowLeftIcon from '@/assets/svgs/arrowLeft.svg';
import { ThemeToggleButton } from '@/components/ThemeToggleButton';
import { mockSongs, type Song } from '@/src/data/songs';
import { useAppTheme } from '@/src/theme/AppTheme';
import { textStyles } from '@/src/theme/styles';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

type ChordInstance = {
  id: string;
  typeId: string;
  charIndex: number;
};

type LyricRow = {
  id: string;
  text: string;
  grid: string[];
  chords: ChordInstance[];
};

type ChordType = {
  id: string;
  label: string;
};

export default function SongScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const { colors } = useAppTheme();

  const song: Song | undefined = useMemo(
    () => mockSongs.find((s) => s.id === id),
    [id],
  );

  // Lyrics rows (always an array)
  const [rows, setRows] = useState<LyricRow[]>([
    {
      id: 'row-1',
      text: 'This is a sample lyric line.',
      grid: 'This is a sample lyric line.'.split(''),
      chords: [],
    },
    {
      id: 'row-2',
      text: 'Tap here and type to edit these lyrics.',
      grid: 'Tap here and type to edit these lyrics.'.split(''),
      chords: [],
    },
    { id: 'row-3', text: '', grid: ''.split(''), chords: [] },
    {
      id: 'row-4',
      text: 'Later, chords will appear above lyric rows.',
      grid: 'Later, chords will appear above lyric rows.'.split(''),
      chords: [],
    },
    {
      id: 'row-5',
      text: 'But for now, this is just clean editable text.',
      grid: 'But for now, this is just clean editable text.'.split(''),
      chords: [],
    },
  ]);

  // Chord palette (types, not positions)
  const [chordPalette, setChordPalette] = useState<ChordType[]>([
    { id: 'chord-1', label: 'G' },
    { id: 'chord-2', label: 'C' },
    { id: 'chord-3', label: 'D' },
    { id: 'chord-4', label: 'Em' },
  ]);

  const [selectedChordId, setSelectedChordId] = useState<string | null>(null);
  const [isAddingChord, setIsAddingChord] = useState(false);
  const [newChordLabel, setNewChordLabel] = useState('');

  const handleToggleSelectChord = (id: string) => {
    setSelectedChordId((current) => (current === id ? null : id));
  };

  const handleConfirmAddChord = () => {
    const trimmed = newChordLabel.trim();
    if (!trimmed) return;

    const exists = chordPalette.some(
      (c) => c.label.toLowerCase() === trimmed.toLowerCase(),
    );
    if (exists) {
      setIsAddingChord(false);
      setNewChordLabel('');
      return;
    }

    const newChord: ChordType = {
      id: `chord-${Date.now()}`,
      label: trimmed,
    };

    setChordPalette((prev) => [...prev, newChord]);
    setNewChordLabel('');
    setIsAddingChord(false);
  };

  const handleCancelAddChord = () => {
    setNewChordLabel('');
    setIsAddingChord(false);
  };

  const handleRemoveChord = (idToRemove: string) => {
    setChordPalette((prev) => prev.filter((c) => c.id !== idToRemove));
    setSelectedChordId((current) => (current === idToRemove ? null : current));
  };

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
            {
              backgroundColor: colors.primary,
              flexDirection: 'row',
              gap: 8,
            },
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

      {/* Body: lyrics area + bottom chord palette */}
      <View style={styles.body}>
        {/* Lyrics editor area */}
        <ScrollView
          style={styles.lyricsScroll}
          contentContainerStyle={styles.lyricsContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.lyricsWrapper}>
            {rows.map((row) => (
              <View key={row.id} style={styles.rowBlock}>
                {row.chords.length > 0 && (
                  <View style={styles.chordRowPlaceholder} />
                )}

                <TextInput
                  value={row.text}
                  multiline
                  onChangeText={(txt) => {
                    const grid = txt.split('');

                    setRows((prev) =>
                      prev.map((r) =>
                        r.id === row.id ? { ...r, text: txt, grid } : r,
                      ),
                    );
                  }}
                  style={[styles.lyricLine, { color: colors.neutral }]}
                  placeholder=""
                  placeholderTextColor={colors.neutralMedium}
                  underlineColorAndroid="transparent"
                  autoCapitalize="sentences"
                  autoCorrect
                  textAlignVertical="top"
                />
              </View>
            ))}
          </View>
        </ScrollView>

        {/* Bottom chord palette bar (Edit mode only for now) */}
        <View
          style={[
            styles.paletteBar,
            {
              borderTopColor: colors.neutralMedium + '33',
              backgroundColor: colors.white,
            },
          ]}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.paletteContent}
          >
            {chordPalette.map((chord) => {
              const isSelected = selectedChordId === chord.id;

              return (
                <View key={chord.id} style={styles.chordPillWrapper}>
                  <Pressable
                    onPress={() => handleToggleSelectChord(chord.id)}
                    onLongPress={() => {
                      // Later: start drag from palette
                      console.log(
                        'Long-pressed chord type (ready for drag):',
                        chord,
                      );
                    }}
                    delayLongPress={150}
                    style={({ pressed }) => [
                      styles.chordPill,
                      {
                        backgroundColor: isSelected
                          ? colors.greenLight
                          : colors.greenLight,
                        opacity: pressed ? 0.8 : 1,
                        borderColor: isSelected
                          ? colors.primary
                          : 'transparent',
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: colors.primary,
                        fontSize: 16,
                        fontFamily: 'OverpassMono',
                      }}
                    >
                      {chord.label}
                    </Text>

                    {isSelected && (
                      <Pressable
                        onPress={() => handleRemoveChord(chord.id)}
                        hitSlop={8}
                        style={styles.chordDeleteButton}
                      >
                        <Text
                          style={{
                            color: colors.neutralMedium,
                            fontSize: 12,
                          }}
                        >
                          ✕
                        </Text>
                      </Pressable>
                    )}
                  </Pressable>
                </View>
              );
            })}

            {/* Add chord UI */}
            {!isAddingChord ? (
              <Pressable
                onPress={() => {
                  setSelectedChordId(null);
                  setIsAddingChord(true);
                }}
                style={[
                  styles.addChordButton,
                  {
                    borderColor: colors.neutralMedium,
                  },
                ]}
              >
                <Text style={{ fontSize: 16, color: colors.primary }}>
                  + Add chord
                </Text>
              </Pressable>
            ) : (
              <View style={styles.addChordRow}>
                <TextInput
                  value={newChordLabel}
                  onChangeText={setNewChordLabel}
                  placeholder="e.g. G, Gmaj7"
                  placeholderTextColor={colors.neutralMedium}
                  style={[
                    styles.addChordInput,
                    {
                      borderColor: colors.neutralMedium,
                      color: colors.neutral,
                    },
                  ]}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  underlineColorAndroid="transparent"
                />

                <Pressable
                  onPress={handleConfirmAddChord}
                  hitSlop={6}
                  style={styles.addChordAction}
                >
                  <Text style={{ fontSize: 18, color: colors.primary }}>✓</Text>
                </Pressable>

                <Pressable
                  onPress={handleCancelAddChord}
                  hitSlop={6}
                  style={styles.addChordAction}
                >
                  <Text style={{ fontSize: 18, color: colors.neutralMedium }}>
                    ✕
                  </Text>
                </Pressable>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
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
  body: {
    flex: 1,
  },
  lyricsScroll: {
    flex: 1,
  },

  lyricsContainer: {
    paddingHorizontal: 40,
    paddingBottom: 80,
    // backgroundColor: 'blue',
  },

  lyricsWrapper: {
    width: '100%',
    // backgroundColor: 'yellow',
  },

  rowBlock: {
    marginBottom: 0,
  },

  chordRowPlaceholder: {
    height: 24,
    marginBottom: 4,
    backgroundColor: 'transparent',
  },
  lyricLine: {
    padding: 0,
    borderWidth: 0,
    includeFontPadding: false,
    textAlign: 'left',
    backgroundColor: 'transparent',
    fontFamily: 'OverpassMono',
    fontSize: 16,
    lineHeight: 21,
  },
  // Bottom chord palette
  paletteBar: {
    borderTopWidth: 1,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  paletteContent: {
    alignItems: 'center',
    gap: 8,
  },
  chordPillWrapper: {
    marginRight: 8,
  },
  chordPill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chordDeleteButton: {
    marginLeft: 6,
  },
  addChordButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  addChordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 4,
    gap: 8,
  },
  addChordInput: {
    minWidth: 140,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 16,
  },
  addChordAction: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
});
