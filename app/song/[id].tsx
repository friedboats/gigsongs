import ArrowLeftIcon from '@/assets/svgs/arrowLeft.svg';
import { ThemeToggleButton } from '@/components/ThemeToggleButton';
import { mockSongs, type Song } from '@/src/data/songs';
import { useAppTheme } from '@/src/theme/AppTheme';
import { textStyles } from '@/src/theme/styles';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

type ChordType = {
  id: string;
  label: string;
};

type EditorLayout = { x: number; y: number; width: number; height: number };

type DragHover = {
  line: number; // line index in text.split('\n')
  col: number; // char column within that line
} | null;

type ActiveDrag = {
  typeId: string;
  label: string;
  pageX: number;
  pageY: number;
} | null;

type SelectedChordToken = {
  lineIndex: number;
  startCol: number;
  endCol: number;
  token: string;
} | null;

const uid = () => `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const FONT_FAMILY = 'OverpassMono';
const FONT_SIZE = 16;

// ✅ Keep your “perfect” original feel
const LINE_HEIGHT = 21;

// Visual caret indicator
const CARET_WIDTH = 2;

const EDITOR_PADDING_X = 12;
const TEXT_PADDING_TOP = 12;

const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, v));

function LibraryChordPill(props: {
  typeId: string;
  label: string;
  colors: any;
  onTap: () => void;
  onDragStart: (
    typeId: string,
    label: string,
    pageX: number,
    pageY: number,
  ) => void;
  onDragMove: (pageX: number, pageY: number) => void;
  onDragEnd: (didDrop: boolean, pageX: number, pageY: number) => void;
}) {
  const { typeId, label, colors, onTap, onDragStart, onDragMove, onDragEnd } =
    props;

  const isDraggingRef = useRef(false);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,

        onPanResponderGrant: (evt) => {
          isDraggingRef.current = false;
          const { pageX, pageY } = evt.nativeEvent;
          onDragStart(typeId, label, pageX, pageY);
        },

        onPanResponderMove: (_evt, g) => {
          if (
            !isDraggingRef.current &&
            (Math.abs(g.dx) > 4 || Math.abs(g.dy) > 4)
          ) {
            isDraggingRef.current = true;
          }
          onDragMove(g.moveX, g.moveY);
        },

        onPanResponderRelease: (_evt, g) => {
          const isTap = !isDraggingRef.current;
          if (isTap) {
            onTap();
            onDragEnd(false, g.moveX, g.moveY);
            return;
          }
          onDragEnd(true, g.moveX, g.moveY);
        },

        onPanResponderTerminate: (_evt, g) => {
          onDragEnd(false, g.moveX, g.moveY);
        },
      }),
    [label, onDragEnd, onDragMove, onDragStart, onTap, typeId],
  );

  return (
    <View
      {...panResponder.panHandlers}
      style={[styles.chordPill, { backgroundColor: colors.greenLight }]}
    >
      <Text
        style={{
          fontFamily: FONT_FAMILY,
          fontSize: 16,
          color: colors.primary,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

/**
 * Phase 1 rule:
 * A chord line is blank OR contains only chord-ish tokens/spaces.
 */
function isChordLine(line: string) {
  const stripped = line.replace(/\s/g, '');
  if (stripped.length === 0) return true;
  return /^[A-Ga-g0-9#b()\/+\-:._]+$/.test(stripped);
}

function padTo(line: string, col: number) {
  if (line.length >= col) return line;
  return line + ' '.repeat(col - line.length);
}

/**
 * Replace characters in [col, col+len) with spaces (then trim right).
 * Simple overlap rule for text-based chords.
 */
function clearOverlapOnChordLine(chordLine: string, col: number, len: number) {
  const start = col;
  const end = col + len;

  const padded = padTo(chordLine, end);
  const chars = padded.split('');
  for (let i = start; i < end; i++) chars[i] = ' ';
  return chars.join('').replace(/\s+$/g, '');
}

/**
 * Ensure a chord line exists directly above a lyric line.
 * Then place chord label at col (as actual text).
 */
function placeChordAsText(
  fullText: string,
  lyricLineIndex: number,
  col: number,
  chordLabel: string,
) {
  const lines = fullText.split('\n');
  const len = chordLabel.length;

  const hasChordLineAbove =
    lyricLineIndex > 0 && isChordLine(lines[lyricLineIndex - 1] ?? '');

  if (!hasChordLineAbove) {
    // Insert blank chord line above this lyric line
    lines.splice(lyricLineIndex, 0, '');
  }

  const chordIdx = hasChordLineAbove ? lyricLineIndex - 1 : lyricLineIndex;
  const currentChordLine = lines[chordIdx] ?? '';

  const cleared = clearOverlapOnChordLine(currentChordLine, col, len);

  const padded = padTo(cleared, col);
  const base = padded.split('');
  const targetLen = Math.max(base.length, col + len);
  while (base.length < targetLen) base.push(' ');

  chordLabel.split('').forEach((ch, i) => {
    base[col + i] = ch;
  });

  lines[chordIdx] = base.join('').replace(/\s+$/g, '');

  return lines.join('\n');
}

// ----- tap-to-delete chord token helpers (Step 1) -----

function isChordChar(ch: string) {
  return /[A-Ga-g0-9#b()\/+\-:._]/.test(ch);
}

function findChordTokenAt(line: string, col: number) {
  if (col < 0 || col >= line.length) return null;
  if (!isChordChar(line[col])) return null;

  let start = col;
  let end = col + 1;

  while (start - 1 >= 0 && isChordChar(line[start - 1])) start--;
  while (end < line.length && isChordChar(line[end])) end++;

  const token = line.slice(start, end);
  return { start, end, token };
}

function removeSpanOnLine(line: string, start: number, end: number) {
  const chars = line.split('');
  for (let i = start; i < end; i++) chars[i] = ' ';
  return chars.join('').replace(/\s+$/g, '');
}

function getLineIndexAndColFromAbs(fullText: string, abs: number) {
  const lines = fullText.split('\n');

  let running = 0;
  for (let i = 0; i < lines.length; i++) {
    const lineLen = lines[i].length;
    const lineStart = running;
    const lineEnd = running + lineLen;

    if (abs >= lineStart && abs <= lineEnd) {
      return { lineIndex: i, col: abs - lineStart };
    }

    running = lineEnd + 1; // +1 for '\n'
  }

  return {
    lineIndex: lines.length - 1,
    col: lines[lines.length - 1]?.length ?? 0,
  };
}

export default function SongScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const { colors } = useAppTheme();

  const song: Song | undefined = useMemo(
    () => mockSongs.find((s) => s.id === id),
    [id],
  );

  const [text, setText] = useState(
    song?.lyrics ?? 'Type lyrics here...\nDrag chords onto this text.',
  );

  const inputRef = useRef<TextInput | null>(null);
  const [selection, setSelection] = useState({ start: 0, end: 0 });

  const [chordPalette, setChordPalette] = useState<ChordType[]>([
    { id: 'chord-1', label: 'G' },
    { id: 'chord-2', label: 'Cmaj7' },
    { id: 'chord-3', label: 'D' },
    { id: 'chord-4', label: 'Em' },
  ]);

  const getChordLabel = (typeId: string) =>
    chordPalette.find((c) => c.id === typeId)?.label ?? '?';

  const [selectedChordTypeId, setSelectedChordTypeId] = useState<string | null>(
    null,
  );
  const [selectedChordLabel, setSelectedChordLabel] = useState<string | null>(
    null,
  );

  const [isAddingChord, setIsAddingChord] = useState(false);
  const [newChordLabel, setNewChordLabel] = useState('');

  // NEW: selected chord token within TEXT (tap-to-delete)
  const [selectedChordToken, setSelectedChordToken] =
    useState<SelectedChordToken>(null);

  // Drag state
  const [activeDrag, setActiveDrag] = useState<ActiveDrag>(null);
  const [dragHover, setDragHover] = useState<DragHover>(null);
  const dragHoverRef = useRef<DragHover>(null);

  // Editor layout
  const editorRef = useRef<View | null>(null);
  const editorLayoutRef = useRef<EditorLayout | null>(null);

  // monospace char width estimate (measured)
  const [charWidth, setCharWidth] = useState(9);

  const remeasureEditor = () => {
    editorRef.current?.measureInWindow?.((x, y, width, height) => {
      editorLayoutRef.current = { x, y, width, height };
    });
  };

  useEffect(() => {
    const t = setTimeout(() => remeasureEditor(), 0);
    return () => clearTimeout(t);
  }, []);

  const computeHoverFromPageXY = (pageX: number, pageY: number): DragHover => {
    const layout = editorLayoutRef.current;
    if (!layout) return null;

    const withinX = pageX >= layout.x && pageX <= layout.x + layout.width;
    const withinY = pageY >= layout.y && pageY <= layout.y + layout.height;
    if (!withinX || !withinY) return null;

    const localX = pageX - layout.x - EDITOR_PADDING_X;
    const localY = pageY - layout.y - TEXT_PADDING_TOP;

    const lines = text.split('\n');
    const lineCount = lines.length;

    const line = clamp(
      Math.floor(localY / LINE_HEIGHT),
      0,
      Math.max(0, lineCount - 1),
    );
    const lineText = lines[line] ?? '';

    const col = clamp(Math.round(localX / charWidth), 0, lineText.length);

    return { line, col };
  };

  const updateDragHover = (pageX: number, pageY: number) => {
    setActiveDrag((d) => (d ? { ...d, pageX, pageY } : d));
    const hover = computeHoverFromPageXY(pageX, pageY);
    if (hover) dragHoverRef.current = hover;
    setDragHover(hover);
  };

  const dropChordIntoText = (typeId: string, hover: DragHover) => {
    if (!hover) return;

    const chordLabel = getChordLabel(typeId);

    const lines = text.split('\n');
    const droppedLineIsChord = isChordLine(lines[hover.line] ?? '');

    const targetLyricLine = droppedLineIsChord
      ? clamp(hover.line + 1, 0, lines.length - 1)
      : hover.line;

    const nextText = placeChordAsText(
      text,
      targetLyricLine,
      hover.col,
      chordLabel,
    );
    setText(nextText);

    setSelectedChordTypeId(null);
    setSelectedChordLabel(null);
    setSelectedChordToken(null);
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

    setChordPalette((prev) => [...prev, { id: uid(), label: trimmed }]);
    setNewChordLabel('');
    setIsAddingChord(false);
  };

  const handleCancelAddChord = () => {
    setNewChordLabel('');
    setIsAddingChord(false);
  };

  const deleteSelectedChordType = () => {
    if (!selectedChordTypeId) return;

    setChordPalette((prev) => prev.filter((c) => c.id !== selectedChordTypeId));

    setSelectedChordTypeId(null);
    setSelectedChordLabel(null);
    setIsAddingChord(false);
    setNewChordLabel('');
  };

  const deleteSelectedChordToken = () => {
    if (!selectedChordToken) return;

    const { lineIndex, startCol, endCol } = selectedChordToken;
    const lines = text.split('\n');
    const line = lines[lineIndex] ?? '';

    lines[lineIndex] = removeSpanOnLine(line, startCol, endCol);
    setText(lines.join('\n'));
    setSelectedChordToken(null);
  };

  const onKeyPress = (e: any) => {
    const key = e?.nativeEvent?.key;
    if (key !== 'Backspace') return;
    // Phase 1: plain text behavior (do not special-case)
  };

  const onEditorPressIn = () => {
    // use current caret as "tap position"
    const caret = selection.start;

    const { lineIndex, col } = getLineIndexAndColFromAbs(text, caret);
    const lines = text.split('\n');
    const lineText = lines[lineIndex] ?? '';

    // only chord line tokens are deletable via this UI
    if (!isChordLine(lineText)) {
      setSelectedChordToken(null);
      return;
    }

    const info = findChordTokenAt(lineText, col);
    if (!info) {
      setSelectedChordToken(null);
      return;
    }

    setSelectedChordToken({
      lineIndex,
      startCol: info.start,
      endCol: info.end,
      token: info.token,
    });

    // also clear palette selection UI
    setSelectedChordTypeId(null);
    setSelectedChordLabel(null);
    setIsAddingChord(false);
  };

  const renderDragCaret = () => {
    if (!dragHover) return null;

    const left = EDITOR_PADDING_X + dragHover.col * charWidth;
    const top = TEXT_PADDING_TOP + dragHover.line * LINE_HEIGHT - 2;

    return (
      <View
        pointerEvents="none"
        style={[
          styles.dropCaret,
          {
            left,
            top,
            height: LINE_HEIGHT + 10,
            backgroundColor: colors.primary,
          },
        ]}
      />
    );
  };

  const renderDragGhost = () => {
    if (!activeDrag) return null;

    return (
      <View
        pointerEvents="none"
        style={[
          styles.dragGhost,
          {
            left: activeDrag.pageX - 20,
            top: activeDrag.pageY - 18,
            backgroundColor: colors.greenLight,
            borderColor: colors.primary + '55',
          },
        ]}
      >
        <Text
          style={{
            fontFamily: FONT_FAMILY,
            fontSize: 16,
            color: colors.primary,
          }}
        >
          {activeDrag.label}
        </Text>
      </View>
    );
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
      {renderDragGhost()}

      {/* Header */}
      <View style={styles.header}>
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

      {/* Hidden monospace measurement */}
      <View style={{ position: 'absolute', left: -9999, top: -9999 }}>
        <Text
          style={{ fontFamily: FONT_FAMILY, fontSize: FONT_SIZE }}
          onLayout={(e) => {
            const w = e.nativeEvent.layout.width;
            const per = w / 10;
            if (per > 0) setCharWidth(per);
          }}
        >
          MMMMMMMMMM
        </Text>
      </View>

      {/* Body */}
      <View style={styles.body}>
        <View
          ref={(node) => {
            editorRef.current = node;
            if (node) remeasureEditor();
          }}
          onLayout={remeasureEditor}
          style={[
            styles.editorShell,
            {
              borderColor: colors.neutralMedium + '55',
              backgroundColor: colors.white,
            },
          ]}
        >
          <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
            {renderDragCaret()}
          </View>

          <TextInput
            ref={inputRef}
            value={text}
            onChangeText={(t) => {
              setText(t);
              // if user edits, clear selected token (safe)
              setSelectedChordToken(null);
            }}
            multiline
            style={[
              styles.editorInput,
              {
                color: colors.neutral,
                paddingLeft: EDITOR_PADDING_X,
                paddingRight: EDITOR_PADDING_X,
                paddingTop: TEXT_PADDING_TOP,
              },
            ]}
            placeholder="Type lyrics..."
            placeholderTextColor={colors.neutralMedium}
            textAlignVertical="top"
            autoCapitalize="sentences"
            autoCorrect
            onSelectionChange={(e) => setSelection(e.nativeEvent.selection)}
            onKeyPress={onKeyPress}
            onPressIn={onEditorPressIn}
          />
        </View>

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
          {/* 1) If chord token selected in TEXT -> show delete */}
          {selectedChordToken && (
            <View style={styles.actionRow}>
              <Pressable
                onPress={deleteSelectedChordToken}
                style={[styles.actionButton, { borderColor: colors.primary }]}
              >
                <Text style={{ color: colors.primary, fontSize: 16 }}>
                  Delete “{selectedChordToken.token}”
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setSelectedChordToken(null)}
                style={[
                  styles.actionButton,
                  { borderColor: colors.neutralMedium },
                ]}
              >
                <Text style={{ color: colors.neutral, fontSize: 16 }}>
                  Done
                </Text>
              </Pressable>
            </View>
          )}

          {/* 2) Else if chord type selected in library -> show delete */}
          {!selectedChordToken && selectedChordTypeId && (
            <View style={styles.actionRow}>
              <Pressable
                onPress={deleteSelectedChordType}
                style={[styles.actionButton, { borderColor: colors.primary }]}
              >
                <Text style={{ color: colors.primary, fontSize: 16 }}>
                  Delete “{selectedChordLabel ?? ''}”
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setSelectedChordTypeId(null);
                  setSelectedChordLabel(null);
                }}
                style={[
                  styles.actionButton,
                  { borderColor: colors.neutralMedium },
                ]}
              >
                <Text style={{ color: colors.neutral, fontSize: 16 }}>
                  Done
                </Text>
              </Pressable>
            </View>
          )}

          {/* 3) Normal palette UI */}
          {!selectedChordToken && !selectedChordTypeId && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.paletteContent}
              keyboardShouldPersistTaps="handled"
            >
              {chordPalette.map((chord) => (
                <LibraryChordPill
                  key={chord.id}
                  typeId={chord.id}
                  label={chord.label}
                  colors={colors}
                  onTap={() => {
                    setSelectedChordTypeId(chord.id);
                    setSelectedChordLabel(chord.label);
                    setIsAddingChord(false);
                  }}
                  onDragStart={(typeId, label, pageX, pageY) => {
                    dragHoverRef.current = null;
                    setActiveDrag({ typeId, label, pageX, pageY });

                    // clear selections while dragging
                    setSelectedChordToken(null);
                    setSelectedChordTypeId(null);
                    setSelectedChordLabel(null);

                    updateDragHover(pageX, pageY);
                  }}
                  onDragMove={(pageX, pageY) => updateDragHover(pageX, pageY)}
                  onDragEnd={(didDrop, _pageX, _pageY) => {
                    if (didDrop) {
                      const hover = dragHoverRef.current;
                      if (hover) dropChordIntoText(chord.id, hover);
                    }
                    setActiveDrag(null);
                    setDragHover(null);
                    dragHoverRef.current = null;
                  }}
                />
              ))}

              {!isAddingChord ? (
                <Pressable
                  onPress={() => setIsAddingChord(true)}
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
                    placeholder="e.g. Gmaj7"
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
                    <Text style={{ fontSize: 18, color: colors.primary }}>
                      ✓
                    </Text>
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
          )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
    width: '100%',
  },
  backButton: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: { fontSize: 18 },

  body: { flex: 1, paddingHorizontal: 24, paddingBottom: 18 },

  editorShell: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
    flex: 1,
    position: 'relative',
  },

  editorInput: {
    flex: 1,
    paddingBottom: 12,
    fontFamily: FONT_FAMILY,
    fontSize: FONT_SIZE,
    lineHeight: LINE_HEIGHT,
    minHeight: 220,
  },

  dropCaret: {
    position: 'absolute',
    width: CARET_WIDTH,
    borderRadius: 2,
    opacity: 0.95,
  },

  dragGhost: {
    position: 'absolute',
    zIndex: 9999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    opacity: 0.95,
  },

  paletteBar: {
    borderTopWidth: 1,
    paddingTop: 12,
    marginTop: 12,
  },
  paletteContent: {
    alignItems: 'center',
    gap: 8,
  },

  chordPill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },

  addChordButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
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
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 16,
  },
  addChordAction: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },

  actionRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
});
