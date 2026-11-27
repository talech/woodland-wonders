import { palette } from '@ww/game-ui';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { View } from 'react-native';
import { LevelList } from '../features/LevelList.tsx';
import { LEVELS, type LevelStatus, levelStatus, nextUnsolved } from '../game/levels.ts';
import { useSave } from '../storage/SaveProvider.tsx';

export default function LevelsRoute() {
  const router = useRouter();
  const save = useSave();
  const statuses = useMemo(() => {
    const out: Record<string, LevelStatus> = {};
    for (const level of LEVELS) out[level.id] = levelStatus(save.data, level.id);
    return out;
  }, [save.data]);
  if (!save.loaded)
    return <View style={{ flex: 1, backgroundColor: palette.paper }} testID="levels-loading" />;
  return (
    <LevelList
      levels={LEVELS}
      statuses={statuses}
      suggestedId={nextUnsolved(save.data)?.id ?? null}
      onOpen={(id) => router.push(`/puzzle/${id}`)}
    />
  );
}
