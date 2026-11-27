import {
  Board,
  HintPanel,
  type HintPanelAction,
  palette,
  SceneComplete,
  SpeciesTray,
  Toolbar,
} from '@ww/game-ui';
import { canRedo, canUndo, type GameState, type Puzzle } from '@ww/puzzle-core';
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  type LayoutChangeEvent,
  ScrollView,
  type ScrollViewInstance,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { HintActionId } from '../game/hintText.ts';
import { STRINGS } from '../game/labels.ts';
import {
  contentWidth,
  HINT_PANEL_GAP,
  MAX_CONTENT_WIDTH,
  MIN_HINT_PANEL,
  puzzleScreenLayout,
  SCROLL_PADDING_BOTTOM,
  SCROLL_PADDING_TOP,
  SECTION_GAP,
  SIDE_PADDING,
  trayCardBasis,
  trayIsCompact,
} from '../game/layout.ts';
import { speciesArt } from '../game/presentation.ts';
import { createSession, type SessionAction, sessionReducer } from '../game/session.ts';
import { useReducedMotion } from '../game/useReducedMotion.ts';
import { derivePuzzleView } from '../game/view.ts';
import { ScreenHeader } from './ScreenHeader.tsx';

const HINT_ACTIONS: Readonly<Record<HintActionId, SessionAction>> = {
  reveal: { type: 'revealHint' },
  apply: { type: 'applyHint' },
  rewind: { type: 'askRewind' },
  'confirm-rewind': { type: 'confirmRewind' },
  'cancel-rewind': { type: 'cancelRewind' },
};

export interface PuzzleScreenProps {
  readonly puzzle: Puzzle;
  readonly title: string;
  readonly subtitle?: string;
  readonly onBack: () => void;
  /** Omit when there is no next puzzle. */
  readonly onNext?: () => void;
  /** Saved board + history to resume from. */
  readonly initialGame?: GameState;
  /** Called after every board change (persistence). */
  readonly onGameChange?: (game: GameState) => void;
  /** Called once each time the board becomes solved. */
  readonly onSolved?: () => void;
}

/** Keeps the last measured height; ignores sub-pixel jitter to avoid re-layout loops. */
function useMeasuredHeight(): [number | null, (e: LayoutChangeEvent) => void] {
  const [height, setHeight] = useState<number | null>(null);
  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const next = Math.round(e.nativeEvent.layout.height);
    setHeight((prev) => (prev === next ? prev : next));
  }, []);
  return [height, onLayout];
}

/**
 * Playable puzzle. Header, tray and board scroll; the toolbar is a fixed bottom bar so core controls are always
 * reachable. Mount with `key={puzzle id}` so switching puzzles starts a fresh session.
 */
export function PuzzleScreen({
  puzzle,
  title,
  subtitle,
  onBack,
  onNext,
  initialGame,
  onGameChange,
  onSolved,
}: PuzzleScreenProps) {
  const [session, send] = useReducer(sessionReducer, undefined, () => createSession(puzzle, initialGame));
  const view = useMemo(() => derivePuzzleView(session), [session]);
  const { width, height, fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const [chromeHeight, onChromeLayout] = useMeasuredHeight();
  // The scroll viewport is measured only while the hint panel is closed; the open layout derives from it.
  const hintOpen = session.hint !== null;
  const hintOpenRef = useRef(hintOpen);
  hintOpenRef.current = hintOpen;
  const [closedViewportHeight, setClosedViewportHeight] = useState<number | null>(null);
  const scrollRef = useRef<ScrollViewInstance>(null);
  const boardY = useRef(0);
  const pendingBoardScroll = useRef(false);
  const scrollToBoard = useCallback((animated: boolean) => {
    scrollRef.current?.scrollTo({ y: Math.max(0, boardY.current - SCROLL_PADDING_TOP), animated });
  }, []);
  const onViewportLayout = useCallback(
    (e: LayoutChangeEvent) => {
      if (hintOpenRef.current) {
        // The viewport just shrank for the hint panel: scroll now that the new size is known.
        if (pendingBoardScroll.current) {
          pendingBoardScroll.current = false;
          scrollToBoard(false);
        }
        return;
      }
      const next = Math.round(e.nativeEvent.layout.height);
      setClosedViewportHeight((prev) => (prev === next ? prev : next));
    },
    [scrollToBoard],
  );

  const availableWidth = contentWidth(width, insets);
  const { board: layout, hintPanelHeight } = puzzleScreenLayout({
    availableWidth,
    closedViewportHeight,
    chromeHeight,
    windowHeight: height,
    insets,
    rows: puzzle.rows,
    columns: puzzle.columns,
    fontScale,
    hintOpen,
  });
  const compactTray = trayIsCompact(availableWidth, puzzle.species.length, fontScale);

  const onCellPress = useCallback((cell: number) => send({ type: 'tapCell', cell }), []);
  const onSelectSpecies = useCallback((species: string) => send({ type: 'selectSpecies', species }), []);
  const onSelectEmpty = useCallback(() => send({ type: 'selectEmpty' }), []);
  const onUndo = useCallback(() => send({ type: 'undo' }), []);
  const onRedo = useCallback(() => send({ type: 'redo' }), []);
  const onHint = useCallback(() => send({ type: hintOpen ? 'dismissHint' : 'requestHint' }), [hintOpen]);
  const onDismissHint = useCallback(() => send({ type: 'dismissHint' }), []);

  const hint = view.hint;
  const announcement = hint?.announcement ?? null;
  useEffect(() => {
    if (announcement) AccessibilityInfo.announceForAccessibility(announcement);
  }, [announcement]);
  const hintActions: HintPanelAction[] = useMemo(
    () =>
      (hint?.actions ?? []).map((a) => ({
        id: a.id,
        label: a.label,
        primary: a.primary,
        onPress: () => send(HINT_ACTIONS[a.id]),
      })),
    [hint],
  );
  // When a hint opens, scroll header + tray away so the whole board (and every highlight) is visible.
  const onBoardLayout = useCallback((e: LayoutChangeEvent) => {
    boardY.current = e.nativeEvent.layout.y;
  }, []);
  useEffect(() => {
    pendingBoardScroll.current = hintOpen;
    if (hintOpen) scrollToBoard(!reducedMotion);
  }, [hintOpen, reducedMotion, scrollToBoard]);
  const hintSteps = useMemo(() => (hint?.steps ?? []).map((text, i) => ({ key: `step-${i}`, text })), [hint]);

  // Persist every board change (the initial, restored board is not a change).
  const savedGame = useRef(session.game);
  const onGameChangeRef = useRef(onGameChange);
  onGameChangeRef.current = onGameChange;
  useEffect(() => {
    if (session.game === savedGame.current) return;
    savedGame.current = session.game;
    onGameChangeRef.current?.(session.game);
  }, [session.game]);

  const wasSolved = useRef(view.solved);
  const onSolvedRef = useRef(onSolved);
  onSolvedRef.current = onSolved;
  useEffect(() => {
    if (view.solved && !wasSolved.current) {
      AccessibilityInfo.announceForAccessibility(STRINGS.completeTitle);
      onSolvedRef.current?.();
    }
    wasSolved.current = view.solved;
  }, [view.solved]);

  const animals = useMemo(() => puzzle.species.map(speciesArt), [puzzle]);
  const { tool, game } = session;

  return (
    <View
      style={[
        styles.screen,
        { paddingTop: insets.top, paddingLeft: insets.left, paddingRight: insets.right },
      ]}
    >
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        onLayout={onViewportLayout}
        contentContainerStyle={styles.content}
        testID="puzzle-scroll"
      >
        <View style={styles.chrome} onLayout={onChromeLayout} testID="puzzle-chrome">
          <ScreenHeader title={title} {...(subtitle != null ? { subtitle } : {})} onBack={onBack} />
          <SpeciesTray
            tools={view.tools}
            selectedId={tool.kind === 'species' ? tool.species : null}
            onSelect={onSelectSpecies}
            compact={compactTray}
            cardBasis={trayCardBasis(fontScale)}
          />
        </View>
        {view.solved && (
          <SceneComplete
            animals={animals}
            reducedMotion={reducedMotion}
            title={STRINGS.completeTitle}
            message={STRINGS.completeMessage}
            nextLabel={STRINGS.next}
            backLabel={STRINGS.backToList}
            onBack={onBack}
            {...(onNext ? { onNext } : {})}
          />
        )}
        <View onLayout={onBoardLayout} testID="puzzle-board-wrap">
          <Board
            rows={puzzle.rows}
            columns={puzzle.columns}
            cells={view.cells}
            rowClues={view.rowClues}
            columnClues={view.columnClues}
            cellSize={layout.cellSize}
            clueSize={layout.clueSize}
            onCellPress={onCellPress}
          />
        </View>
      </ScrollView>
      <View style={[styles.toolbarBar, { paddingBottom: insets.bottom + 8 }]} testID="puzzle-toolbar">
        <View style={styles.toolbarInner}>
          {hint && (
            <HintPanel
              tone={hint.tone}
              title={hint.title}
              body={hint.body}
              steps={hintSteps}
              {...(hint.conclusion !== null ? { conclusion: hint.conclusion } : {})}
              actions={hintActions}
              dismissLabel={STRINGS.closeHint}
              onDismiss={onDismissHint}
              height={hintPanelHeight ?? MIN_HINT_PANEL}
            />
          )}
          <Toolbar
            emptySelected={tool.kind === 'empty'}
            canUndo={canUndo(game)}
            canRedo={canRedo(game)}
            onSelectEmpty={onSelectEmpty}
            onUndo={onUndo}
            onRedo={onRedo}
            onHint={onHint}
            hintActive={hintOpen}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.paper },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: SIDE_PADDING,
    paddingTop: SCROLL_PADDING_TOP,
    paddingBottom: SCROLL_PADDING_BOTTOM,
    gap: SECTION_GAP,
    maxWidth: MAX_CONTENT_WIDTH,
    width: '100%',
    alignSelf: 'center',
  },
  chrome: { gap: SECTION_GAP },
  toolbarBar: {
    paddingTop: 8,
    paddingHorizontal: SIDE_PADDING,
    borderTopWidth: 1,
    borderTopColor: palette.grassEdge,
    backgroundColor: palette.paper,
  },
  toolbarInner: { maxWidth: MAX_CONTENT_WIDTH, width: '100%', alignSelf: 'center', gap: HINT_PANEL_GAP },
});
