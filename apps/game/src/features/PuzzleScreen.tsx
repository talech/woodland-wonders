import { Board, palette, SceneComplete, SpeciesTray, Toolbar } from '@ww/game-ui';
import { canRedo, canUndo, type Puzzle } from '@ww/puzzle-core';
import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import { AccessibilityInfo, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { STRINGS } from '../game/labels.ts';
import { computeBoardLayout, SIDE_PADDING } from '../game/layout.ts';
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

/** Playable puzzle. Mount with `key={puzzle id}` so switching puzzles starts a fresh session. */
export function PuzzleScreen({ puzzle, title, subtitle, onBack, onNext }: PuzzleScreenProps) {
  const [session, send] = useReducer(sessionReducer, puzzle, createSession);
  const view = useMemo(() => derivePuzzleView(session), [session]);
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const layout = computeBoardLayout({ width, height, insets, rows: puzzle.rows, columns: puzzle.columns });
  const reducedMotion = useReducedMotion();

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
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 16 }]}
        testID="puzzle-scroll"
      >
        <ScreenHeader title={title} {...(subtitle != null ? { subtitle } : {})} onBack={onBack} />
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
        <SpeciesTray
          tools={view.tools}
          selectedId={tool.kind === 'species' ? tool.species : null}
          onSelect={onSelectSpecies}
        />
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
        <Toolbar
          emptySelected={tool.kind === 'empty'}
          canUndo={canUndo(game)}
          canRedo={canRedo(game)}
          onSelectEmpty={onSelectEmpty}
          onUndo={onUndo}
          onRedo={onRedo}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.paper },
  content: {
    paddingHorizontal: SIDE_PADDING,
    paddingTop: 8,
    gap: 12,
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center',
  },
});
