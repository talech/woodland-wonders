import { useRouter } from 'expo-router';
import { HowToPlay } from '../features/HowToPlay.tsx';
import { TUTORIAL_HREF } from '../game/tutorial.ts';

export default function HowToPlayRoute() {
  const router = useRouter();
  return (
    <HowToPlay
      onBack={() => (router.canGoBack() ? router.back() : router.replace('/'))}
      onTutorial={() => router.push(TUTORIAL_HREF)}
    />
  );
}
