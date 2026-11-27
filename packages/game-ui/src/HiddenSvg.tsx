/**
 * Decorative SVG hidden from assistive tech. The hiding props live on a View wrapper, because
 * react-native-svg forwards unknown props (Android's `importantForAccessibility`) to the DOM <svg> on web,
 * which makes React warn.
 */
import type { ReactNode } from 'react';
import { View } from 'react-native';
import Svg from 'react-native-svg';

export function HiddenSvg({
  size,
  viewBox,
  children,
}: {
  readonly size: number;
  readonly viewBox: string;
  readonly children: ReactNode;
}) {
  return (
    <View aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg width={size} height={size} viewBox={viewBox}>
        {children}
      </Svg>
    </View>
  );
}
