import { palette } from '@ww/game-ui';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef } from 'react';
import { View } from 'react-native';
import { LevelList } from '../features/LevelList.tsx';
import { LevelListExtras } from '../features/LevelListExtras.tsx';
import { LEVELS, type LevelStatus, levelStatus, nextUnsolved } from '../game/levels.ts';
import { TUTORIAL_HREF } from '../game/tutorial.ts';
import { useSave } from '../storage/SaveProvider.tsx';

export default function LevelsRoute() {
  const router = useRouter();
  const save = useSave();
  const statuses = useMemo(() => {
    const out: Record<string, LevelStatus> = {};
    for (const level of LEVELS) out[level.id] = levelStatus(save.data, level.id);
    return out;
  }, [save.data]);

  // First launch: start the interactive tutorial once per app run (only from the level list, so deep links to
  // /puzzle/<id> are never interrupted). Skipping or finishing sets `onboardingDone`.
  const started = useRef(false);
  const needsOnboarding = save.loaded && !save.data.settings.onboardingDone;
  useEffect(() => {
    if (needsOnboarding && !started.current) {
      started.current = true;
      router.push(TUTORIAL_HREF);
    }
  }, [needsOnboarding, router]);

  if (!save.loaded)
    return <View style={{ flex: 1, backgroundColor: palette.paper }} testID="levels-loading" />;
  return (
    <LevelList
      levels={LEVELS}
      statuses={statuses}
      suggestedId={nextUnsolved(save.data)?.id ?? null}
      onOpen={(id) => router.push(`/puzzle/${id}`)}
      extra={<LevelListExtras onHowToPlay={() => router.push('/how-to-play')} />}
    />
  );
}
