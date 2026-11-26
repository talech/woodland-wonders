import { Board, palette, SceneComplete, SpeciesTray, Toolbar } from '@ww/game-ui';
import { canRedo, canUndo, type Puzzle } from '@ww/puzzle-core';
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  type LayoutChangeEvent,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { STRINGS } from '../game/labels.ts';
import {
  boardSpaceHeight,
  computeBoardLayout,
  contentWidth,
  MAX_CONTENT_WIDTH,
  SCROLL_PADDING_BOTTOM,
  SCROLL_PADDING_TOP,
  SECTION_GAP,
  SIDE_PADDING,
  trayCardBasis,
  trayIsCompact,
} from '../game/layout.ts';
import { speciesArt } from '../game/presentation.ts';
import { createSession, sessionReducer } from '../game/session.ts';
import { useReducedMotion } from '../game/useReducedMotion.ts';
import { derivePuzzleView } from '../game/view.ts';
import { ScreenHeader } from './ScreenHeader.tsx';

export interface PuzzleScreenProps {
  readonly puzzle: Puzzle;
  readonly title: string;
  readonly subtitle?: string;
  readonly onBack: () => void;
  /** Omit when there is no next puzzle. */
  readonly onNext?: () => void;
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
export function PuzzleScreen({ puzzle, title, subtitle, onBack, onNext }: PuzzleScreenProps) {
  const [session, send] = useReducer(sessionReducer, puzzle, createSession);
  const view = useMemo(() => derivePuzzleView(session), [session]);
  const { width, height, fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const [viewportHeight, onViewportLayout] = useMeasuredHeight();
  const [chromeHeight, onChromeLayout] = useMeasuredHeight();

  const availableWidth = contentWidth(width, insets);
  const layout = computeBoardLayout({
    availableWidth,
    availableHeight: boardSpaceHeight({ viewportHeight, chromeHeight, windowHeight: height, insets }),
    rows: puzzle.rows,
    columns: puzzle.columns,
  });
  const compactTray = trayIsCompact(availableWidth, puzzle.species.length, fontScale);

  const onCellPress = useCallback((cell: number) => send({ type: 'tapCell', cell }), []);
  const onSelectSpecies = useCallback((species: string) => send({ type: 'selectSpecies', species }), []);
  const onSelectEmpty = useCallback(() => send({ type: 'selectEmpty' }), []);
  const onUndo = useCallback(() => send({ type: 'undo' }), []);
  const onRedo = useCallback(() => send({ type: 'redo' }), []);

  const wasSolved = useRef(false);
  useEffect(() => {
    if (view.solved && !wasSolved.current) AccessibilityInfo.announceForAccessibility(STRINGS.completeTitle);
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
      </ScrollView>
      <View style={[styles.toolbarBar, { paddingBottom: insets.bottom + 8 }]} testID="puzzle-toolbar">
        <View style={styles.toolbarInner}>
          <Toolbar
            emptySelected={tool.kind === 'empty'}
            canUndo={canUndo(game)}
            canRedo={canRedo(game)}
            onSelectEmpty={onSelectEmpty}
            onUndo={onUndo}
            onRedo={onRedo}
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
  toolbarInner: { maxWidth: MAX_CONTENT_WIDTH, width: '100%', alignSelf: 'center' },
});
