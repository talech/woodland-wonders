import { renderHook, waitFor } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';
import { useReducedMotion } from '../src/game/useReducedMotion';

afterEach(() => jest.restoreAllMocks());

describe('useReducedMotion', () => {
  it('allows motion when the platform does not ask to reduce it', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
    const { result } = await renderHook(() => useReducedMotion());
    await waitFor(() => expect(result.current).toBe(false));
  });

  it('stays still when the platform asks for reduced motion', async () => {
    const spy = jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
    const { result } = await renderHook(() => useReducedMotion());
    await waitFor(() => expect(spy).toHaveBeenCalled());
    expect(result.current).toBe(true);
  });
});
