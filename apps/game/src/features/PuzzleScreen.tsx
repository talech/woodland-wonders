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
  ESTIMATED_SCENE_BANNER,
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
import { createSession, type SessionAction } from '../game/session.ts';
import { createScreenState, screenReducer, TUTORIAL_STEPS, TUTORIAL_TEXT } from '../game/tutorial.ts';
import { useReducedMotion } from '../game/useReducedMotion.ts';
import { derivePuzzleView } from '../game/view.ts';
import { CoachCard } from './CoachCard.tsx';
import { ConfirmBar } from './ConfirmBar.tsx';
import { ScreenHeader } from './ScreenHeader.tsx';
import { SpeciesIntro } from './SpeciesIntro.tsx';

/** Vertical padding of the fixed bottom bar (its top border adds 1 pt). */
const TOOLBAR_BAR_PADDING = 8;

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
  /** Run the interactive tutorial on this board. */
  readonly tutorial?: boolean;
  /** Tutorial finished (all steps done) or skipped. */
  readonly onTutorialEnd?: (reason: 'finished' | 'skipped') => void;
  /** Species to introduce with a one-line card (first time a species appears). */
  readonly introSpecies?: readonly string[];
  /** Saved reduced-motion preference ('system' follows the OS setting). */
  readonly reducedMotionSetting?: 'system' | 'on' | 'off';
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
  tutorial = false,
  onTutorialEnd,
  introSpecies = [],
  reducedMotionSetting = 'system',
}: PuzzleScreenProps) {
  const [state, send] = useReducer(screenReducer, undefined, () =>
    createScreenState(createSession(puzzle, initialGame), tutorial),
  );
  const { session, tutorial: tutorialStep } = state;
  const onTutorialEndRef = useRef(onTutorialEnd);
  onTutorialEndRef.current = onTutorialEnd;
  useEffect(() => {
    if (tutorialStep === 'done') onTutorialEndRef.current?.('finished');
  }, [tutorialStep]);
  useEffect(() => {
    if (tutorialStep) AccessibilityInfo.announceForAccessibility(TUTORIAL_TEXT[tutorialStep].title);
  }, [tutorialStep]);
  const onSkipTutorial = useCallback(() => {
    send({ type: 'closeTutorial' });
    onTutorialEndRef.current?.('skipped');
  }, []);
  const [introDismissed, setIntroDismissed] = useState(false);
  const view = useMemo(() => derivePuzzleView(session), [session]);
  const { width, height, fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion(reducedMotionSetting);
  const [chromeHeight, onChromeLayout] = useMeasuredHeight();
  // The board region's "closed" height (no bottom panel) is derived from the screen and the toolbar alone, so
  // it is known even when a puzzle opens already solved with the completion banner showing.
  const hintOpen = session.hint !== null;
  const sceneOpen = view.solved && !hintOpen;
  const panelOpen = hintOpen || sceneOpen;
  const panelOpenRef = useRef(panelOpen);
  panelOpenRef.current = panelOpen;
  const [screenHeight, onScreenLayout] = useMeasuredHeight();
  const [toolbarHeight, onToolbarLayout] = useMeasuredHeight();
  const [bannerHeight, onBannerLayout] = useMeasuredHeight();
  const closedViewportHeight =
    screenHeight === null || toolbarHeight === null
      ? null
      : screenHeight - insets.top - (TOOLBAR_BAR_PADDING * 2 + 1 + insets.bottom + toolbarHeight);
  const scrollRef = useRef<ScrollViewInstance>(null);
  const boardY = useRef(0);
  const pendingBoardScroll = useRef(false);
  const scrollToBoard = useCallback((animated: boolean) => {
    scrollRef.current?.scrollTo({ y: Math.max(0, boardY.current - SCROLL_PADDING_TOP), animated });
  }, []);
  const onViewportLayout = useCallback(() => {
    // The viewport just changed for a bottom panel: scroll now that the new size is known.
    if (panelOpenRef.current && pendingBoardScroll.current) {
      pendingBoardScroll.current = false;
      scrollToBoard(false);
    }
  }, [scrollToBoard]);

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
    sceneBanner: sceneOpen ? (bannerHeight ?? ESTIMATED_SCENE_BANNER) : null,
  });
  const compactTray = trayIsCompact(availableWidth, puzzle.species.length, fontScale);

  const onCellPress = useCallback((cell: number) => send({ type: 'tapCell', cell }), []);
  const onSelectSpecies = useCallback((species: string) => send({ type: 'selectSpecies', species }), []);
  const onSelectEmpty = useCallback(() => send({ type: 'selectEmpty' }), []);
  const onUndo = useCallback(() => send({ type: 'undo' }), []);
  const onRedo = useCallback(() => send({ type: 'redo' }), []);
  const onHint = useCallback(() => send({ type: hintOpen ? 'dismissHint' : 'requestHint' }), [hintOpen]);
  const onDismissHint = useCallback(() => send({ type: 'dismissHint' }), []);
  const [confirmingReset, setConfirmingReset] = useState(false);
  // "Play again" clears the board as one undoable move (no extra confirmation needed).
  const onReplay = useCallback(() => send({ type: 'reset' }), []);
  const onConfirmReset = useCallback(() => {
    send({ type: 'reset' });
    setConfirmingReset(false);
  }, []);

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
  // When a hint or the completion banner opens, scroll header + tray away so the whole board (every highlight,
  // or the finished woodland scene) is visible above it.
  const onBoardLayout = useCallback(
    (e: LayoutChangeEvent) => {
      boardY.current = e.nativeEvent.layout.y;
      if (panelOpenRef.current && pendingBoardScroll.current) scrollToBoard(false);
    },
    [scrollToBoard],
  );
  useEffect(() => {
    pendingBoardScroll.current = panelOpen;
    if (panelOpen) scrollToBoard(!reducedMotion);
  }, [panelOpen, reducedMotion, scrollToBoard]);
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

  const { tool, game } = session;

  return (
    <View
      style={[
        styles.screen,
        { paddingTop: insets.top, paddingLeft: insets.left, paddingRight: insets.right },
      ]}
      onLayout={onScreenLayout}
      testID="puzzle-screen"
    >
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        onLayout={onViewportLayout}
        contentContainerStyle={styles.content}
        testID="puzzle-scroll"
      >
        <View style={styles.chrome} onLayout={onChromeLayout} testID="puzzle-chrome">
          <ScreenHeader
            title={title}
            {...(subtitle != null ? { subtitle } : {})}
            onBack={onBack}
            action={{
              label: STRINGS.reset,
              accessibilityLabel: STRINGS.resetLabel,
              onPress: () => setConfirmingReset(true),
            }}
          />
          {tutorialStep && (
            <CoachCard
              step={TUTORIAL_STEPS.indexOf(tutorialStep) + 1}
              total={TUTORIAL_STEPS.length}
              title={TUTORIAL_TEXT[tutorialStep].title}
              body={TUTORIAL_TEXT[tutorialStep].body}
              {...(tutorialStep === 'done'
                ? { onDone: () => send({ type: 'closeTutorial' }) }
                : { onSkip: onSkipTutorial })}
            />
          )}
          {!tutorialStep && !introDismissed && introSpecies.length > 0 && (
            <SpeciesIntro
              species={introSpecies}
              homes={Object.fromEntries(puzzle.ruleset.species.map((s) => [s.id, s.habitats] as const))}
              onDismiss={() => setIntroDismissed(true)}
            />
          )}
          {confirmingReset && (
            <ConfirmBar
              testID="reset-confirm"
              question={STRINGS.resetQuestion}
              confirmLabel={STRINGS.resetConfirm}
              cancelLabel={STRINGS.resetCancel}
              onConfirm={onConfirmReset}
              onCancel={() => setConfirmingReset(false)}
            />
          )}
          <SpeciesTray
            tools={view.tools}
            selectedId={tool.kind === 'species' ? tool.species : null}
            onSelect={onSelectSpecies}
            compact={compactTray}
            cardBasis={trayCardBasis(fontScale)}
          />
        </View>
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
            scene={view.solved}
            reducedMotion={reducedMotion}
          />
        </View>
      </ScrollView>
      <View
        style={[styles.toolbarBar, { paddingBottom: insets.bottom + TOOLBAR_BAR_PADDING }]}
        testID="puzzle-toolbar"
      >
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
          {sceneOpen && (
            <View onLayout={onBannerLayout}>
              <SceneComplete
                compact
                animals={[]}
                reducedMotion={reducedMotion}
                title={STRINGS.completeTitle}
                message={STRINGS.completeMessage}
                nextLabel={STRINGS.next}
                backLabel={STRINGS.backToList}
                backShortLabel={STRINGS.levelsShort}
                onBack={onBack}
                replayLabel={STRINGS.playAgain}
                onReplay={onReplay}
                {...(onNext ? { onNext } : {})}
              />
            </View>
          )}
          <View onLayout={onToolbarLayout} testID="puzzle-toolbar-tools">
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
    paddingTop: TOOLBAR_BAR_PADDING,
    paddingHorizontal: SIDE_PADDING,
    borderTopWidth: 1,
    borderTopColor: palette.grassEdge,
    backgroundColor: palette.paper,
  },
  toolbarInner: { maxWidth: MAX_CONTENT_WIDTH, width: '100%', alignSelf: 'center', gap: HINT_PANEL_GAP },
});
