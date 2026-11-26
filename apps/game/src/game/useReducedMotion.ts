import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * Tracks the OS "reduce motion" setting. Starts as `true` (still) until the platform answers, so users who asked
 * for reduced motion never see a flash of animation.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(true);
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => {
        if (alive) setReduced(value);
      })
      .catch(() => {
        // Unsupported platform: allow the short, non-essential animation.
        if (alive) setReduced(false);
      });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', (value) => setReduced(value));
    return () => {
      alive = false;
      sub.remove();
    };
  }, []);
  return reduced;
}
