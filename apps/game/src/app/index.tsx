import { useRouter } from 'expo-router';
import { LevelList } from '../features/LevelList.tsx';
import { LEVELS } from '../game/levels.ts';

export default function LevelsRoute() {
  const router = useRouter();
  return <LevelList levels={LEVELS} onOpen={(id) => router.push(`/puzzle/${id}`)} />;
}
