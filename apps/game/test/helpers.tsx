import type { ReactNode } from 'react';
import { SafeAreaFrameContext, SafeAreaInsetsContext } from 'react-native-safe-area-context';

/** Provides safe-area metrics without the native provider (jest has no native safe-area module). */
export function SafeAreaTestProvider({ children }: { children: ReactNode }) {
  return (
    <SafeAreaFrameContext.Provider value={{ x: 0, y: 0, width: 390, height: 844 }}>
      <SafeAreaInsetsContext.Provider value={{ top: 47, bottom: 34, left: 0, right: 0 }}>
        {children}
      </SafeAreaInsetsContext.Provider>
    </SafeAreaFrameContext.Provider>
  );
}
