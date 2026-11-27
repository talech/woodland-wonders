import { palette } from '@ww/game-ui';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { View } from 'react-native';
import { NotFound } from '../../features/NotFound.tsx';
import { PuzzleScreen } from '../../features/PuzzleScreen.tsx';
import { levelTitle, sizeText, tierText } from '../../game/labels.ts';
import { findLevel, levelStatus, newSpecies, nextUnsolved } from '../../game/levels.ts';
import { TUTORIAL_PUZZLE_ID } from '../../game/tutorial.ts';
import { useSave, useSaveStore } from '../../storage/SaveProvider.tsx';
import { toGameState } from '../../storage/saveData.ts';

export default function PuzzleRoute() {
  const { id, tutorial } = useLocalSearchParams<{ id: string; tutorial?: string }>();
  const router = useRouter();
  const store = useSaveStore();
  const save = useSave();
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/'));
  const level = typeof id === 'string' ? findLevel(id) : undefined;
  if (!level) return <NotFound onBack={goBack} />;
  // Wait for the save so a resumed board is restored before the session starts.
  if (!save.loaded)
    return <View style={{ flex: 1, backgroundColor: palette.paper }} testID="puzzle-loading" />;

  // The tutorial runs only when explicitly requested (level-list first launch or "How to play"), on a fresh board.
  const tutorialMode = tutorial === '1' && level.id === TUTORIAL_PUZZLE_ID;
  const active = tutorialMode ? undefined : save.data.active[level.id];
  const fresh = levelStatus(save.data, level.id) === 'new';
  const next = nextUnsolved(save.data, level.id);
  const { rows, columns, difficulty, revision } = level.definition;
  return (
    <PuzzleScreen
      key={`${level.id}${tutorialMode ? ':tutorial' : ''}`}
      puzzle={level.puzzle}
      title={levelTitle(level.number)}
      subtitle={`${sizeText(rows, columns)} · ${tierText(difficulty?.tier)}`}
      onBack={goBack}
      {...(active ? { initialGame: toGameState(level.id, active) } : {})}
      onGameChange={(game) => store.setActive(level.id, game)}
      onSolved={() => store.markCompleted(level.id, revision)}
      tutorial={tutorialMode}
      onTutorialEnd={() => store.updateSettings({ onboardingDone: true })}
      introSpecies={fresh ? newSpecies(level.id) : []}
      {...(next ? { onNext: () => router.replace(`/puzzle/${next.id}`) } : {})}
    />
  );
}
