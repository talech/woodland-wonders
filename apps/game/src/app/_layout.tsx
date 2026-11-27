import { palette } from '@ww/game-ui';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { findLevel } from '../game/levels.ts';
import { asyncStorageAdapter } from '../storage/asyncStorageAdapter.ts';
import { SaveProvider } from '../storage/SaveProvider.tsx';
import { createSaveStore } from '../storage/store.ts';

export default function RootLayout() {
  const [store] = useState(() =>
    createSaveStore({ adapter: asyncStorageAdapter, findPuzzle: (id) => findLevel(id)?.puzzle }),
  );
  return (
    <SaveProvider store={store}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: palette.paper } }} />
      <StatusBar style="dark" />
    </SaveProvider>
  );
}
