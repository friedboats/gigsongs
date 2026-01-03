import ArrowLeftIcon from '@/assets/svgs/arrowLeft.svg';
import { ThemeToggleButton } from '@/components/ThemeToggleButton';
import { mockSongs, type Song } from '@/src/data/songs';
import { useAppTheme } from '@/src/theme/AppTheme';
import { textStyles } from '@/src/theme/styles';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

type ChordType = { id: string; label: string };
type EditorLayout = { x: number; y: number; width: number; height: number };
type DragHover = { line: number; col: number } | null;

type ActiveDrag = {
  source: 'palette' | 'existing';
  typeId?: string;
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

type ExistingDragState = {
  token: string;
  textBeforeDrag: string;
} | null;

const uid = () => `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const FONT_FAMILY = 'OverpassMono';
const FONT_SIZE = 16;
const LINE_HEIGHT = 21;

const CARET_WIDTH = 2;
const EDITOR_PADDING_X = 12;
const TEXT_PADDING_TOP = 12;

// ✅ Explicit chord-line marker (zero-width char)
const CHORD_MARK = '\u200B';

const hasChordMark = (line: string) => line.startsWith(CHORD_MARK);
const stripChordMark = (line: string) =>
  hasChordMark(line) ? line.slice(1) : line;
const makeChordLine = () => CHORD_MARK;

const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, v));

/**
 * Token chars inside a chord line (supports: maj, min, dim, sus, add, aug, etc.)
 */
function isChordChar(ch: string) {
  return /[A-Za-z0-9#b()\/+\-:._]/.test(ch);
}

/**
 * ✅ ONLY marked lines are chord lines.
 * This prevents lyric text from being misclassified.
 */
function isChordLine(line: string) {
  return hasChordMark(line);
}

function padTo(line: string, col: number) {
  if (line.length >= col) return line;
  return line + ' '.repeat(col - line.length);
}

function getChordTokensOnLine(lineContent: string) {
  const tokens: { start: number; end: number }[] = [];
  let i = 0;

  while (i < lineContent.length) {
    if (!isChordChar(lineContent[i])) {
      i++;
      continue;
    }
    const start = i;
    let end = i + 1;
    while (end < lineContent.length && isChordChar(lineContent[end])) end++;
    tokens.push({ start, end });
    i = end;
  }
  return tokens;
}

/**
 * ✅ “Touch tolerant” replacement.
 * If the drop span touches any cell of a token (with ±1 col forgiveness),
 * remove the whole token.
 */
function clearOverlappingChordTokens(
  chordLineContent: string,
  dropCol: number,
  dropLen: number,
) {
  const tokens = getChordTokensOnLine(chordLineContent);

  const touchStart = Math.max(0, dropCol - 1);
  const touchLast = Math.max(0, dropCol + dropLen); // inclusive-ish w/ tolerance

  const chars = chordLineContent.split('');

  tokens.forEach(({ start, end }) => {
    const tokenLast = end - 1;
    const overlaps = touchStart <= tokenLast && touchLast >= start;
    if (overlaps) {
      for (let i = start; i < end; i++) chars[i] = ' ';
    }
  });

  return chars.join('').replace(/\s+$/g, '');
}

function findChordTokenAtChordLine(line: string, col: number) {
  const content = stripChordMark(line);

  if (col < 0 || col >= content.length) return null;
  if (!isChordChar(content[col])) return null;

  let start = col;
  let end = col + 1;

  while (start - 1 >= 0 && isChordChar(content[start - 1])) start--;
  while (end < content.length && isChordChar(content[end])) end++;

  const token = content.slice(start, end);
  return { start, end, token };
}

function removeSpanOnLine(line: string, start: number, end: number) {
  const mark = hasChordMark(line) ? CHORD_MARK : '';
  const content = stripChordMark(line);

  const chars = content.split('');
  for (let i = start; i < end; i++) chars[i] = ' ';
  const out = chars.join('').replace(/\s+$/g, '');

  return mark + out;
}

/**
 * ✅ IMPORTANT CHANGE:
 * We do NOT merge chord stacks anymore.
 * Intro chords can be multiple consecutive chord lines.
 */
function normalizeChordStacks(fullText: string) {
  return fullText;
}

/**
 * ✅ Deterministic drop model:
 * - If dropping onto a totally blank lyric line, convert that line into a chord line (no insert above)
 * - If hovering a chord line, lyric is below
 * - Otherwise ensure chord line directly above lyric
 * - Clear any chord token touched, then place new chord
 */
function placeChordAtDrop(
  fullText: string,
  hoverLine: number,
  col: number,
  chordLabel: string,
) {
  let lines = fullText.split('\n');
  const len = chordLabel.length;

  const safeHover = clamp(hoverLine, 0, Math.max(0, lines.length - 1));
  const hoverLineText = lines[safeHover] ?? '';
  const hoverIsChord = isChordLine(hoverLineText);

  // ✅ If dropping onto a blank lyric line, convert THIS line into a chord line (intro-friendly)
  const hoverIsBlankLyricLine =
    !hoverIsChord && stripChordMark(hoverLineText).trim().length === 0;

  if (hoverIsBlankLyricLine) {
    const content = ''; // empty chord lane
    const cleared = clearOverlappingChordTokens(content, col, len);

    const padded = padTo(cleared, col);
    const base = padded.split('');
    const targetLen = Math.max(base.length, col + len);
    while (base.length < targetLen) base.push(' ');

    chordLabel.split('').forEach((ch, i) => {
      base[col + i] = ch;
    });

    lines[safeHover] = CHORD_MARK + base.join('').replace(/\s+$/g, '');
    return normalizeChordStacks(lines.join('\n'));
  }

  // Normal behavior: place chord above lyric line
  let lyricLineIndex = hoverIsChord ? safeHover + 1 : safeHover;
  if (lyricLineIndex >= lines.length) lines.push('');

  let chordLineIndex = lyricLineIndex - 1;
  const chordLineExists =
    chordLineIndex >= 0 && isChordLine(lines[chordLineIndex] ?? '');

  if (!chordLineExists) {
    lines.splice(lyricLineIndex, 0, makeChordLine());
    chordLineIndex = lyricLineIndex;
    lyricLineIndex += 1;
  }

  const current = lines[chordLineIndex] ?? makeChordLine();
  const content = stripChordMark(current);

  const cleared = clearOverlappingChordTokens(content, col, len);

  const padded = padTo(cleared, col);
  const base = padded.split('');
  const targetLen = Math.max(base.length, col + len);
  while (base.length < targetLen) base.push(' ');

  chordLabel.split('').forEach((ch, i) => {
    base[col + i] = ch;
  });

  lines[chordLineIndex] = CHORD_MARK + base.join('').replace(/\s+$/g, '');

  return normalizeChordStacks(lines.join('\n'));
}

/**
 * If a marked chord line becomes marker-only (empty content), remove it (collapse lyric line up).
 */
function collapseEmptyChordLines(fullText: string) {
  const lines = fullText.split('\n');
  const out: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? '';
    if (hasChordMark(line)) {
      const content = stripChordMark(line).replace(/\s+$/g, '');
      if (content.length === 0) {
        continue; // drop this chord line
      }
    }
    out.push(line);
  }

  return out.join('\n');
}

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
  onDragEnd: (didDrop: boolean) => void;
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

        onPanResponderRelease: () => {
          const isTap = !isDraggingRef.current;
          if (isTap) {
            onTap();
            onDragEnd(false);
            return;
          }
          onDragEnd(true);
        },

        onPanResponderTerminate: () => {
          onDragEnd(false);
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
        style={{ fontFamily: FONT_FAMILY, fontSize: 16, color: colors.primary }}
      >
        {label}
      </Text>
    </View>
  );
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

  const [selection, setSelection] = useState({ start: 0, end: 0 });

  const [chordPalette, setChordPalette] = useState<ChordType[]>([
    { id: 'chord-1', label: 'G' },
    { id: 'chord-2', label: 'Cmaj7' },
    { id: 'chord-3', label: 'D' },
    { id: 'chord-4', label: 'Em' },
  ]);

  const [selectedChordTypeId, setSelectedChordTypeId] = useState<string | null>(
    null,
  );
  const [selectedChordLabel, setSelectedChordLabel] = useState<string | null>(
    null,
  );

  const [isAddingChord, setIsAddingChord] = useState(false);
  const [newChordLabel, setNewChordLabel] = useState('');

  const [selectedChordToken, setSelectedChordToken] =
    useState<SelectedChordToken>(null);

  const [activeDrag, setActiveDrag] = useState<ActiveDrag>(null);
  const [dragHover, setDragHover] = useState<DragHover>(null);
  const dragHoverRef = useRef<DragHover>(null);

  const existingDragRef = useRef<ExistingDragState>(null);

  const editorRef = useRef<View | null>(null);
  const editorLayoutRef = useRef<EditorLayout | null>(null);

  // ✅ TextInput internal scroll offset
  const textScrollYRef = useRef(0);

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

  const MIN_CHORD_COLS = 60;

  const makeSlotGuideLine = (content: string, targetCols: number) => {
    const padded = padTo(content, targetCols);
    return padded.replace(/ /g, '·');
  };

  const computeHoverFromPageXY = (pageX: number, pageY: number): DragHover => {
    const layout = editorLayoutRef.current;
    if (!layout) return null;

    const withinX = pageX >= layout.x && pageX <= layout.x + layout.width;
    const withinY = pageY >= layout.y && pageY <= layout.y + layout.height;
    if (!withinX || !withinY) return null;

    const localX = pageX - layout.x - EDITOR_PADDING_X;

    const localY =
      pageY - layout.y - TEXT_PADDING_TOP + (textScrollYRef.current || 0);

    const lines = text.split('\n');
    const lineCount = lines.length;

    const line = clamp(
      Math.floor(localY / LINE_HEIGHT),
      0,
      Math.max(0, lineCount - 1),
    );

    const lineText = lines[line] ?? '';
    const visualLen =
      isChordLine(lineText) || stripChordMark(lineText).trim().length === 0
        ? Math.max(stripChordMark(lineText).length, MIN_CHORD_COLS)
        : stripChordMark(lineText).length;

    const col = clamp(
      Math.floor((localX + 0.2 * charWidth) / charWidth),
      0,
      visualLen,
    );

    return { line, col };
  };

  const updateDragHover = (pageX: number, pageY: number) => {
    setActiveDrag((d) => (d ? { ...d, pageX, pageY } : d));
    const hover = computeHoverFromPageXY(pageX, pageY);
    if (hover) dragHoverRef.current = hover;
    setDragHover(hover);
  };

  const dropChordLabelIntoText = (label: string, hover: DragHover) => {
    if (!hover) return;
    const nextText = placeChordAtDrop(text, hover.line, hover.col, label);
    setText(nextText);

    setSelectedChordTypeId(null);
    setSelectedChordLabel(null);
    setSelectedChordToken(null);
  };

  // ✅ One finalizer used by every “end drag” path.
  const finalizeDrag = () => {
    const drag = activeDrag;
    if (!drag) return;

    const hover = dragHoverRef.current;

    if (drag.source === 'existing') {
      if (hover) {
        dropChordLabelIntoText(drag.label, hover);
      } else {
        const snap = existingDragRef.current?.textBeforeDrag;
        if (snap != null) setText(snap);
      }
      existingDragRef.current = null;
    }

    if (drag.source === 'palette') {
      if (hover) {
        dropChordLabelIntoText(drag.label, hover);
      }
    }

    setActiveDrag(null);
    setDragHover(null);
    dragHoverRef.current = null;
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

    lines[lineIndex] = removeSpanOnLine(
      lines[lineIndex] ?? '',
      startCol,
      endCol,
    );

    const cleaned = collapseEmptyChordLines(
      normalizeChordStacks(lines.join('\n')),
    );
    setText(cleaned);

    setSelectedChordToken(null);
  };

  // =========================
  // ✅ Drag existing chord token (capture responder + global fallback)
  // =========================
  const editorPanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: (evt) => {
          if (activeDrag) return false;
          const { pageX, pageY } = evt.nativeEvent;

          const hover = computeHoverFromPageXY(pageX, pageY);
          if (!hover) return false;

          const lines = text.split('\n');
          const lineText = lines[hover.line] ?? '';
          if (!isChordLine(lineText)) return false;

          const tokenInfo = findChordTokenAtChordLine(lineText, hover.col);
          return !!tokenInfo;
        },

        // ✅ capture helps prevent TextInput stealing the responder
        onStartShouldSetPanResponderCapture: (evt) => {
          if (activeDrag) return false;
          const { pageX, pageY } = evt.nativeEvent;

          const hover = computeHoverFromPageXY(pageX, pageY);
          if (!hover) return false;

          const lines = text.split('\n');
          const lineText = lines[hover.line] ?? '';
          if (!isChordLine(lineText)) return false;

          const tokenInfo = findChordTokenAtChordLine(lineText, hover.col);
          return !!tokenInfo;
        },

        onMoveShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponderCapture: () => true,

        onPanResponderTerminationRequest: () => false,

        onPanResponderGrant: (evt) => {
          const { pageX, pageY } = evt.nativeEvent;
          const hover = computeHoverFromPageXY(pageX, pageY);
          if (!hover) return;

          const lines = text.split('\n');
          const lineText = lines[hover.line] ?? '';
          if (!isChordLine(lineText)) return;

          const tokenInfo = findChordTokenAtChordLine(lineText, hover.col);
          if (!tokenInfo) return;

          existingDragRef.current = {
            token: tokenInfo.token,
            textBeforeDrag: text,
          };

          // remove token immediately
          lines[hover.line] = removeSpanOnLine(
            lineText,
            tokenInfo.start,
            tokenInfo.end,
          );
          const removed = collapseEmptyChordLines(lines.join('\n'));
          setText(removed);

          dragHoverRef.current = null;
          setActiveDrag({
            source: 'existing',
            label: tokenInfo.token,
            pageX,
            pageY,
          });

          updateDragHover(pageX, pageY);

          setSelectedChordToken(null);
          setSelectedChordTypeId(null);
          setSelectedChordLabel(null);
          setIsAddingChord(false);
        },

        onPanResponderMove: (_evt, g) => {
          updateDragHover(g.moveX, g.moveY);
        },

        onPanResponderRelease: () => {
          finalizeDrag();
        },

        onPanResponderTerminate: () => {
          finalizeDrag();
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [text, activeDrag, charWidth],
  );

  // =========================

  const onEditorPressIn = () => {
    const caret = selection.start;
    const lines = text.split('\n');

    let running = 0;
    let lineIndex = 0;
    let col = 0;
    for (let i = 0; i < lines.length; i++) {
      const lineLen = lines[i].length;
      const start = running;
      const end = running + lineLen;
      if (caret >= start && caret <= end) {
        lineIndex = i;
        col = caret - start;
        break;
      }
      running = end + 1;
    }

    const lineText = lines[lineIndex] ?? '';
    if (!isChordLine(lineText)) {
      setSelectedChordToken(null);
      return;
    }

    const contentCol = hasChordMark(lineText) ? Math.max(0, col - 1) : col;
    const info = findChordTokenAtChordLine(lineText, contentCol);
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

    setSelectedChordTypeId(null);
    setSelectedChordLabel(null);
    setIsAddingChord(false);
  };

  const renderChordSlotGuides = () => {
    if (!activeDrag) return null;

    const lines = text.split('\n');

    return (
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          { paddingLeft: EDITOR_PADDING_X, paddingTop: TEXT_PADDING_TOP },
        ]}
      >
        {lines.map((line, i) => {
          const isBlankLine = stripChordMark(line).trim().length === 0;
          if (!isChordLine(line) && !isBlankLine) return null;

          const content = isChordLine(line) ? stripChordMark(line) : '';
          const cols = Math.max(content.length, MIN_CHORD_COLS);
          const guide = makeSlotGuideLine(content, cols);

          return (
            <Text
              key={`guide-${i}`}
              style={{
                position: 'absolute',
                top: i * LINE_HEIGHT - (textScrollYRef.current || 0),
                left: 0,
                fontFamily: FONT_FAMILY,
                fontSize: FONT_SIZE,
                lineHeight: LINE_HEIGHT,
                color: colors.neutralMedium + '55',
              }}
            >
              {guide}
            </Text>
          );
        })}
      </View>
    );
  };

  const renderChordLineHighlights = () => {
    const lines = text.split('\n');

    return (
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        {lines.map((line, i) => {
          if (!isChordLine(line)) return null;

          const top =
            TEXT_PADDING_TOP + i * LINE_HEIGHT - (textScrollYRef.current || 0);

          return (
            <View
              key={`chord-hl-${i}`}
              style={{
                position: 'absolute',
                top,
                left: 0,
                right: 0,
                height: LINE_HEIGHT,
                backgroundColor: 'rgba(0, 200, 83, 0.35)', // 👈 VERY APPARENT
              }}
            />
          );
        })}
      </View>
    );
  };

  const renderDragCaret = () => {
    if (!dragHover) return null;

    const left = EDITOR_PADDING_X + dragHover.col * charWidth;

    const top =
      TEXT_PADDING_TOP +
      dragHover.line * LINE_HEIGHT -
      2 -
      (textScrollYRef.current || 0);

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
    <View
      style={{ flex: 1, backgroundColor: colors.white }}
      // ✅ fallback: if TextInput steals responder, still end drag + clear ghost
      onTouchEndCapture={() => {
        if (activeDrag) finalizeDrag();
      }}
      onTouchCancelCapture={() => {
        if (activeDrag) finalizeDrag();
      }}
    >
      {renderDragGhost()}

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
          {...editorPanResponder.panHandlers}
        >
          <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
            {renderDragCaret()}
          </View>

          {renderChordLineHighlights()}

          {renderChordSlotGuides()}

          <TextInput
            value={text}
            onChangeText={(t) => {
              const prevLines = text.split('\n');
              const nextLines = t.split('\n');

              for (let i = 0; i < nextLines.length; i++) {
                const prev = prevLines[i] ?? '';
                const next = nextLines[i] ?? '';
                const wasChord = isChordLine(prev);

                if (!wasChord) continue;

                // If RN ever drops the marker but the content is otherwise the same,
                // re-attach it so chord lines remain chord lines (drag stays working).
                const prevContent = stripChordMark(prev);
                const nextContent = stripChordMark(next);

                const markerLost = !hasChordMark(next);
                const contentSame = nextContent === prevContent;

                if (markerLost && contentSame) {
                  nextLines[i] = CHORD_MARK + nextContent;
                }
              }

              setText(nextLines.join('\n'));
              setSelectedChordToken(null);
            }}
            multiline
            scrollEnabled
            onScroll={(e: NativeSyntheticEvent<NativeScrollEvent>) => {
              textScrollYRef.current = e.nativeEvent.contentOffset.y || 0;
            }}
            scrollEventThrottle={16}
            style={[
              styles.editorInput,
              {
                color: colors.neutral,
                paddingLeft: EDITOR_PADDING_X,
                paddingRight: EDITOR_PADDING_X,
                paddingTop: TEXT_PADDING_TOP,
                backgroundColor: 'transparent',
              },
            ]}
            placeholder="Type lyrics..."
            placeholderTextColor={colors.neutralMedium}
            textAlignVertical="top"
            autoCapitalize="sentences"
            autoCorrect
            onSelectionChange={(e) => setSelection(e.nativeEvent.selection)}
            onPressIn={onEditorPressIn}
          />
        </View>

        <View
          style={[
            styles.paletteBar,
            {
              borderTopColor: colors.neutralMedium + '33',
              backgroundColor: colors.white,
            },
          ]}
        >
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

                    setActiveDrag({
                      source: 'palette',
                      typeId,
                      label,
                      pageX,
                      pageY,
                    });

                    setSelectedChordToken(null);
                    setSelectedChordTypeId(null);
                    setSelectedChordLabel(null);

                    updateDragHover(pageX, pageY);
                  }}
                  onDragMove={(pageX, pageY) => updateDragHover(pageX, pageY)}
                  onDragEnd={() => {
                    finalizeDrag();
                  }}
                />
              ))}

              {!isAddingChord ? (
                <Pressable
                  onPress={() => {
                    setSelectedChordTypeId(null);
                    setSelectedChordLabel(null);
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
