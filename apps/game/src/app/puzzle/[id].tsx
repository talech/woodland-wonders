import { useLocalSearchParams, useRouter } from 'expo-router';
import { NotFound } from '../../features/NotFound.tsx';
import { PuzzleScreen } from '../../features/PuzzleScreen.tsx';
import { levelTitle, sizeText, tierText } from '../../game/labels.ts';
import { findLevel, nextLevel } from '../../game/levels.ts';

export default function PuzzleRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/'));
  const level = typeof id === 'string' ? findLevel(id) : undefined;
  if (!level) return <NotFound onBack={goBack} />;

  const next = nextLevel(level.id);
  const { rows, columns, difficulty } = level.definition;
  return (
    <PuzzleScreen
      key={level.id}
      puzzle={level.puzzle}
      title={levelTitle(level.number)}
      subtitle={`${sizeText(rows, columns)} · ${tierText(difficulty?.tier)}`}
      onBack={goBack}
      {...(next ? { onNext: () => router.replace(`/puzzle/${next.id}`) } : {})}
    />
  );
}
