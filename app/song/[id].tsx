import ArrowLeftIcon from '@/assets/svgs/arrowLeft.svg';
import { ThemeToggleButton } from '@/components/ThemeToggleButton';
import { mockSongs, type Song } from '@/src/data/songs';
import { useAppTheme } from '@/src/theme/AppTheme';
import { textStyles } from '@/src/theme/styles';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
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

type ChordCursor = {
  rowId: string;
  pos: number; // absolute chord-lane position where cursor renders
} | null;

export default function SongScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const { colors } = useAppTheme();

  const song: Song | undefined = useMemo(
    () => mockSongs.find((s) => s.id === id),
    [id],
  );

  const [chordPalette, setChordPalette] = useState<ChordType[]>([
    { id: 'chord-1', label: 'G' },
    { id: 'chord-2', label: 'Cmaj' },
    { id: 'chord-3', label: 'D' },
    { id: 'chord-4', label: 'Em' },
  ]);

  const getChordLabel = (typeId: string) =>
    chordPalette.find((c) => c.id === typeId)?.label ?? '?';

  // Strong blank detection (whitespace + zero-width chars)
  const normalizeText = (s: string) => s.replace(/[\s\u200B\uFEFF]/g, '');
  const isRowBlank = (row: LyricRow) => normalizeText(row.text).length === 0;

  const [rows, setRows] = useState<LyricRow[]>([
    {
      id: 'row-1',
      text: 'This is a sample lyric line.',
      grid: 'This is a sample lyric line.'.split(''),
      chords: [],
    },
    {
      id: 'row-2',
      text: 'When the night is cold',
      grid: 'When the night is cold'.split(''),
      chords: [
        { id: 'ci-r2-1', typeId: 'chord-1', charIndex: 0 }, // G
        { id: 'ci-r2-2', typeId: 'chord-4', charIndex: 9 }, // Em
        { id: 'ci-r2-3', typeId: 'chord-3', charIndex: 18 }, // D
      ],
    },
    {
      id: 'row-3',
      text: '',
      grid: [],
      chords: [
        { id: 'ci-r3-1', typeId: 'chord-2', charIndex: 0 }, // Cmaj
        { id: 'ci-r3-2', typeId: 'chord-1', charIndex: 6 }, // G
        { id: 'ci-r3-3', typeId: 'chord-3', charIndex: 12 }, // D
      ],
    },
    {
      id: 'row-4',
      text: '', // blank lyric row under the chord line (scenario you care about)
      grid: [],
      chords: [],
    },
    {
      id: 'row-5',
      text: 'Later, chords will appear above lyric rows.',
      grid: 'Later, chords will appear above lyric rows.'.split(''),
      chords: [{ id: 'ci-r5-1', typeId: 'chord-2', charIndex: 6 }], // Cmaj
    },
    {
      id: 'row-6',
      text: 'But for now, this is just clean editable text.',
      grid: 'But for now, this is just clean editable text.'.split(''),
      chords: [],
    },
  ]);

  const [armedChordTypeId, setArmedChordTypeId] = useState<string | null>(null);
  const [isAddingChord, setIsAddingChord] = useState(false);
  const [newChordLabel, setNewChordLabel] = useState('');

  const isPlacingChord = !!armedChordTypeId;

  const inputRefs = useRef<Record<string, TextInput | null>>({});
  const [selectionByRow, setSelectionByRow] = useState<
    Record<string, { start: number; end: number }>
  >({});

  const [chordCursor, setChordCursor] = useState<ChordCursor>(null);
  const [cursorBlinkOn, setCursorBlinkOn] = useState(true);

  const lastBackspaceAtRef = useRef<number>(0);

  useEffect(() => {
    const t = setInterval(() => setCursorBlinkOn((v) => !v), 500);
    return () => clearInterval(t);
  }, []);

  const findRowIndex = (rowId: string) => rows.findIndex((r) => r.id === rowId);

  const focusRowAt = (rowId: string, pos: number) => {
    const row = rows.find((r) => r.id === rowId);
    const el = inputRefs.current[rowId];
    if (!row || !el) return;

    const clamped = Math.max(0, Math.min(pos, row.text.length));
    el.focus();
    el.setNativeProps?.({ selection: { start: clamped, end: clamped } });
    setSelectionByRow((p) => ({
      ...p,
      [rowId]: { start: clamped, end: clamped },
    }));
  };

  const focusRowAtEnd = (rowId: string) => {
    const row = rows.find((r) => r.id === rowId);
    const el = inputRefs.current[rowId];
    if (!row || !el) return;

    const end = row.text.length;
    el.focus();
    el.setNativeProps?.({ selection: { start: end, end } });
    setSelectionByRow((p) => ({ ...p, [rowId]: { start: end, end } }));
  };

  const jumpToPrevRowEnd = (currentRowIndex: number) => {
    const prevRow = currentRowIndex > 0 ? rows[currentRowIndex - 1] : null;
    if (!prevRow) return;

    setChordCursor(null);

    setTimeout(() => {
      focusRowAtEnd(prevRow.id);
    }, 0);
  };

  const getRightmostChord = (row: LyricRow) => {
    if (!row.chords.length) return null;

    const chordsWithEnd = row.chords.map((c) => ({
      chord: c,
      end: c.charIndex + getChordLabel(c.typeId).length,
    }));

    chordsWithEnd.sort((a, b) => b.end - a.end);
    return chordsWithEnd[0]!.chord;
  };

  const getChordEndPos = (ch: ChordInstance) =>
    ch.charIndex + getChordLabel(ch.typeId).length;

  const renderChordRow = (row: LyricRow) => {
    if (!row.chords || row.chords.length === 0) return null;

    const minIndex = Math.min(0, ...row.chords.map((c) => c.charIndex));
    const offset = minIndex < 0 ? Math.abs(minIndex) : 0;

    const lyricLen = row.grid.length;

    const chordEnd = Math.max(
      0,
      ...row.chords.map(
        (c) => offset + c.charIndex + getChordLabel(c.typeId).length,
      ),
    );

    const cursorEnd =
      chordCursor?.rowId === row.id ? offset + chordCursor.pos + 1 : 0;

    const lineLen = Math.max(lyricLen + offset, chordEnd, cursorEnd);
    const chars = Array.from({ length: lineLen }, () => ' ');

    row.chords.forEach((chord) => {
      const label = getChordLabel(chord.typeId);
      const start = offset + chord.charIndex;

      label.split('').forEach((ch, i) => {
        const idx = start + i;
        if (idx >= 0 && idx < chars.length) chars[idx] = ch;
      });
    });

    if (chordCursor?.rowId === row.id) {
      const idx = offset + chordCursor.pos;
      if (idx >= 0 && idx < chars.length) {
        chars[idx] = cursorBlinkOn ? '|' : ' ';
      }
    }

    return <Text style={styles.chordText}>{chars.join('')}</Text>;
  };

  const toggleArmedChord = (typeId: string) => {
    setArmedChordTypeId((current) => (current === typeId ? null : typeId));
    setIsAddingChord(false);
  };

  const addChordInstanceToRow = (rowId: string, typeId: string) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== rowId) return r;

        const instance: ChordInstance = {
          id: `ci-${Date.now()}-${Math.random().toString(16).slice(2)}`,
          typeId,
          charIndex: r.text.length,
        };

        return { ...r, chords: [...r.chords, instance] };
      }),
    );
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
      {/* Header */}
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

      {/* Body */}
      <View style={styles.body}>
        <ScrollView
          style={styles.lyricsScroll}
          contentContainerStyle={styles.lyricsContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.lyricsWrapper}>
            {rows.map((row) => {
              const showDropZone = isPlacingChord || row.chords.length > 0;

              return (
                <View key={row.id} style={styles.rowBlock}>
                  {showDropZone && (
                    <Pressable
                      onPress={() => {
                        if (!armedChordTypeId) return;
                        addChordInstanceToRow(row.id, armedChordTypeId);
                      }}
                      style={[
                        styles.chordDropZone,
                        {
                          backgroundColor: isPlacingChord
                            ? colors.greenLight + '55'
                            : 'transparent',
                          borderColor: isPlacingChord
                            ? colors.primary + '33'
                            : 'transparent',
                        },
                      ]}
                    >
                      {renderChordRow(row)}
                    </Pressable>
                  )}

                  <TextInput
                    ref={(el) => {
                      inputRefs.current[row.id] = el;
                    }}
                    value={row.text}
                    multiline
                    onFocus={() => setChordCursor(null)}
                    onSelectionChange={(e) => {
                      const sel = e.nativeEvent.selection;
                      setSelectionByRow((prev) => ({ ...prev, [row.id]: sel }));
                    }}
                    onKeyPress={(e) => {
                      const key = e.nativeEvent.key;
                      const sel = selectionByRow[row.id];
                      const caret = sel ? sel.start : 0;
                      const idx = findRowIndex(row.id);

                      // Arrow nav (hardware keyboard)
                      if (key === 'ArrowUp' && idx > 0) {
                        // @ts-expect-error platform-specific
                        e.preventDefault?.();
                        focusRowAt(rows[idx - 1].id, caret);
                        return;
                      }
                      if (key === 'ArrowDown' && idx < rows.length - 1) {
                        // @ts-expect-error platform-specific
                        e.preventDefault?.();
                        focusRowAt(rows[idx + 1].id, caret);
                        return;
                      }

                      if (key !== 'Backspace') return;

                      const now = Date.now();
                      if (now - lastBackspaceAtRef.current < 80) return;
                      lastBackspaceAtRef.current = now;

                      const caretAtStart = sel
                        ? sel.start === 0 && sel.end === 0
                        : caret === 0;
                      if (!caretAtStart) return;

                      const prevRow = idx > 0 ? rows[idx - 1] : null;

                      // 0) If CURRENT row is blank + has no chords => DELETE IT FIRST.
                      const currentIsBlankNoChords =
                        isRowBlank(row) && row.chords.length === 0;

                      if (currentIsBlankNoChords && idx > 0) {
                        const focusId = rows[idx - 1].id;

                        setChordCursor(null);
                        setRows((prev) => prev.filter((r) => r.id !== row.id));

                        setTimeout(() => {
                          focusRowAtEnd(focusId);
                        }, 0);

                        return;
                      }

                      // Decide chord target row (only immediate prev row; we do NOT “skip over” empty rows)
                      const targetChordRow =
                        row.chords.length > 0
                          ? row
                          : prevRow &&
                            isRowBlank(prevRow) &&
                            prevRow.chords.length > 0
                          ? prevRow
                          : null;

                      if (targetChordRow) {
                        const rightmost = getRightmostChord(targetChordRow);
                        if (!rightmost) return;

                        const rightEnd = getChordEndPos(rightmost);

                        const alreadyAtRightEdge =
                          chordCursor?.rowId === targetChordRow.id &&
                          chordCursor.pos === rightEnd;

                        // First press: show cursor at right edge, no delete
                        if (!alreadyAtRightEdge) {
                          setChordCursor({
                            rowId: targetChordRow.id,
                            pos: rightEnd,
                          });
                          return;
                        }

                        // Second press: delete rightmost chord
                        setRows((prev) =>
                          prev.map((r) =>
                            r.id === targetChordRow.id
                              ? {
                                  ...r,
                                  chords: r.chords.filter(
                                    (c) => c.id !== rightmost.id,
                                  ),
                                }
                              : r,
                          ),
                        );

                        const remaining = targetChordRow.chords.filter(
                          (c) => c.id !== rightmost.id,
                        );
                        const next = remaining
                          .map((c) => ({
                            chord: c,
                            end: c.charIndex + getChordLabel(c.typeId).length,
                          }))
                          .sort((a, b) => b.end - a.end)[0]?.chord;

                        setChordCursor(
                          next
                            ? {
                                rowId: targetChordRow.id,
                                pos:
                                  next.charIndex +
                                  getChordLabel(next.typeId).length,
                              }
                            : null,
                        );

                        return;
                      }

                      // No chord mode => jump to end of previous row.
                      // If previous row is blank, you land there (and you can delete it next press).
                      if (prevRow) {
                        jumpToPrevRowEnd(idx);
                        return;
                      }
                    }}
                    onChangeText={(txt) => {
                      setChordCursor(null);
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
              );
            })}
          </View>
        </ScrollView>

        {/* Bottom chord palette */}
        <View
          style={[
            styles.paletteBar,
            {
              borderTopColor: colors.neutralMedium + '33',
              backgroundColor: colors.white,
            },
          ]}
        >
          {isPlacingChord && (
            <Text style={{ color: colors.neutralMedium, marginBottom: 8 }}>
              Tap above a lyric line to place {getChordLabel(armedChordTypeId!)}
              . Tap it again to cancel.
            </Text>
          )}

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.paletteContent}
            keyboardShouldPersistTaps="handled"
          >
            {chordPalette.map((chord) => {
              const isArmed = armedChordTypeId === chord.id;

              return (
                <View key={chord.id} style={styles.chordPillWrapper}>
                  <Pressable
                    onPress={() => toggleArmedChord(chord.id)}
                    delayLongPress={150}
                    style={({ pressed }) => [
                      styles.chordPill,
                      {
                        backgroundColor: colors.greenLight,
                        opacity: pressed ? 0.8 : 1,
                        borderColor: isArmed ? colors.primary : 'transparent',
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
                  </Pressable>
                </View>
              );
            })}

            {!isAddingChord ? (
              <Pressable
                onPress={() => {
                  setArmedChordTypeId(null);
                  setIsAddingChord(true);
                }}
                style={[
                  styles.addChordButton,
                  { borderColor: colors.neutralMedium },
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

const LINE_HEIGHT = 21;

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
  },
  lyricsWrapper: {
    width: '100%',
  },

  // ✅ ensures blank rows have a visible line to focus into
  rowBlock: {
    marginBottom: 0,
    minHeight: LINE_HEIGHT,
  },

  chordDropZone: {
    minHeight: 22,
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 2,
    marginBottom: 2,
  },
  chordText: {
    fontFamily: 'OverpassMono',
    fontSize: 16,
    color: 'green',
  },

  // ✅ ensures blank TextInput still shows a caret line
  lyricLine: {
    padding: 0,
    borderWidth: 0,
    includeFontPadding: false,
    textAlign: 'left',
    backgroundColor: 'transparent',
    fontFamily: 'OverpassMono',
    fontSize: 16,
    lineHeight: LINE_HEIGHT,
    minHeight: LINE_HEIGHT,
  },

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
