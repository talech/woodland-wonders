/** Small self-authored SVG icons (CC0). Shapes carry meaning so state never relies on colour alone. */
import Svg, { Circle, Path } from 'react-native-svg';
import { palette } from './theme.ts';

export interface IconProps {
  readonly size: number;
  readonly color?: string;
}

const hidden = {
  accessibilityElementsHidden: true,
  importantForAccessibility: 'no-hide-descendants',
} as const;

/** Tick in a disc: "satisfied". */
export function CheckIcon({ size, color = palette.moss }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" {...hidden}>
      <Circle cx={12} cy={12} r={11} fill={color} />
      <Path
        d="M6.5 12.5 L10.5 16.5 L17.5 8"
        stroke="#fffaf0"
        strokeWidth={2.6}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** Exclamation in a rounded diamond: "something here needs another look". */
export function AlertIcon({ size, color = palette.berry }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" {...hidden}>
      <Path d="M12 1.5 L22.5 12 L12 22.5 L1.5 12 Z" fill={color} strokeLinejoin="round" />
      <Path d="M12 6.5 L12 13.5" stroke="#fffaf0" strokeWidth={2.6} strokeLinecap="round" />
      <Circle cx={12} cy={17.2} r={1.6} fill="#fffaf0" />
    </Svg>
  );
}

/** Four-point sparkle: "habitat for the selected animal". */
export function SparkleIcon({ size, color = palette.honey }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" {...hidden}>
      <Path
        d="M12 1 Q13.5 10.5 23 12 Q13.5 13.5 12 23 Q10.5 13.5 1 12 Q10.5 10.5 12 1 Z"
        fill={color}
        stroke="#fffaf0"
        strokeWidth={1}
      />
    </Svg>
  );
}

/** Pebble with a cross: the explicit "empty" mark. */
export function EmptyMarkIcon({ size, color = palette.pebble }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" {...hidden}>
      <Circle cx={12} cy={12} r={9} fill={palette.pebbleSoft} stroke={color} strokeWidth={1.8} />
      <Path
        d="M8.5 8.5 L15.5 15.5 M15.5 8.5 L8.5 15.5"
        stroke={color}
        strokeWidth={2.4}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function UndoIcon({ size, color = palette.bark }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" {...hidden}>
      <Path
        d="M9 5 L4 10 L9 15 M4 10 H14 A6 6 0 0 1 14 22 H10"
        stroke={color}
        strokeWidth={2.4}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function RedoIcon({ size, color = palette.bark }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" {...hidden}>
      <Path
        d="M15 5 L20 10 L15 15 M20 10 H10 A6 6 0 0 0 10 22 H14"
        stroke={color}
        strokeWidth={2.4}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function BackIcon({ size, color = palette.bark }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" {...hidden}>
      <Path
        d="M15 4 L7 12 L15 20"
        stroke={color}
        strokeWidth={2.6}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** Acorn-shaped hint icon. */
export function HintIcon({ size, color = palette.barkSoft }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" {...hidden}>
      <Path d="M4 10 Q12 2 20 10 Z" fill={color} />
      <Path d="M5.5 10.5 H18.5 Q18 19 12 22 Q6 19 5.5 10.5 Z" fill="none" stroke={color} strokeWidth={2} />
      <Path d="M12 2 L12 5" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}
