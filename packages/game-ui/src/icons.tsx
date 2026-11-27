/** Small self-authored SVG icons (CC0). Shapes carry meaning so state never relies on colour alone. */
import { Circle, Path } from 'react-native-svg';
import { HiddenSvg } from './HiddenSvg.tsx';
import { palette } from './theme.ts';

export interface IconProps {
  readonly size: number;
  readonly color?: string;
}

/** Tick in a disc: "satisfied". */
export function CheckIcon({ size, color = palette.moss }: IconProps) {
  return (
    <HiddenSvg size={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={11} fill={color} />
      <Path
        d="M6.5 12.5 L10.5 16.5 L17.5 8"
        stroke="#fffaf0"
        strokeWidth={2.6}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </HiddenSvg>
  );
}

/** Exclamation in a rounded diamond: "something here needs another look". */
export function AlertIcon({ size, color = palette.berry }: IconProps) {
  return (
    <HiddenSvg size={size} viewBox="0 0 24 24">
      <Path d="M12 1.5 L22.5 12 L12 22.5 L1.5 12 Z" fill={color} strokeLinejoin="round" />
      <Path d="M12 6.5 L12 13.5" stroke="#fffaf0" strokeWidth={2.6} strokeLinecap="round" />
      <Circle cx={12} cy={17.2} r={1.6} fill="#fffaf0" />
    </HiddenSvg>
  );
}

/** Four-point sparkle: "habitat for the selected animal". */
export function SparkleIcon({ size, color = palette.honey }: IconProps) {
  return (
    <HiddenSvg size={size} viewBox="0 0 24 24">
      <Path
        d="M12 1 Q13.5 10.5 23 12 Q13.5 13.5 12 23 Q10.5 13.5 1 12 Q10.5 10.5 12 1 Z"
        fill={color}
        stroke="#fffaf0"
        strokeWidth={1}
      />
    </HiddenSvg>
  );
}

/** Pebble with a cross: the explicit "empty" mark. */
export function EmptyMarkIcon({ size, color = palette.pebble }: IconProps) {
  return (
    <HiddenSvg size={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={9} fill={palette.pebbleSoft} stroke={color} strokeWidth={1.8} />
      <Path
        d="M8.5 8.5 L15.5 15.5 M15.5 8.5 L8.5 15.5"
        stroke={color}
        strokeWidth={2.4}
        strokeLinecap="round"
      />
    </HiddenSvg>
  );
}

export function UndoIcon({ size, color = palette.bark }: IconProps) {
  return (
    <HiddenSvg size={size} viewBox="0 0 24 24">
      <Path
        d="M9 5 L4 10 L9 15 M4 10 H14 A6 6 0 0 1 14 22 H10"
        stroke={color}
        strokeWidth={2.4}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </HiddenSvg>
  );
}

export function RedoIcon({ size, color = palette.bark }: IconProps) {
  return (
    <HiddenSvg size={size} viewBox="0 0 24 24">
      <Path
        d="M15 5 L20 10 L15 15 M20 10 H10 A6 6 0 0 0 10 22 H14"
        stroke={color}
        strokeWidth={2.4}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </HiddenSvg>
  );
}

export function BackIcon({ size, color = palette.bark }: IconProps) {
  return (
    <HiddenSvg size={size} viewBox="0 0 24 24">
      <Path
        d="M15 4 L7 12 L15 20"
        stroke={color}
        strokeWidth={2.6}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </HiddenSvg>
  );
}

/** Acorn-shaped hint icon. */
export function HintIcon({ size, color = palette.barkSoft }: IconProps) {
  return (
    <HiddenSvg size={size} viewBox="0 0 24 24">
      <Path d="M4 10 Q12 2 20 10 Z" fill={color} />
      <Path d="M5.5 10.5 H18.5 Q18 19 12 22 Q6 19 5.5 10.5 Z" fill="none" stroke={color} strokeWidth={2} />
      <Path d="M12 2 L12 5" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </HiddenSvg>
  );
}

/** Gear: settings / help. */
export function GearIcon({ size, color = palette.bark }: IconProps) {
  return (
    <HiddenSvg size={size} viewBox="0 0 24 24">
      <Path
        d="M12 2.5 L14 2.9 L14.6 5 L16.4 5.8 L18.3 4.6 L19.8 6.1 L18.6 8 L19.4 9.8 L21.5 10.4 L21.5 13.6 L19.4 14.2 L18.6 16 L19.8 17.9 L18.3 19.4 L16.4 18.2 L14.6 19 L14 21.1 L10 21.1 L9.4 19 L7.6 18.2 L5.7 19.4 L4.2 17.9 L5.4 16 L4.6 14.2 L2.5 13.6 L2.5 10.4 L4.6 9.8 L5.4 8 L4.2 6.1 L5.7 4.6 L7.6 5.8 L9.4 5 L10 2.9 Z"
        fill={color}
        strokeLinejoin="round"
      />
      <Circle cx={12} cy={12} r={3.6} fill={palette.card} />
    </HiddenSvg>
  );
}

/** Circular arrow: restart / reset. */
export function ResetIcon({ size, color = palette.bark }: IconProps) {
  return (
    <HiddenSvg size={size} viewBox="0 0 24 24">
      <Path
        d="M19.5 12 A7.5 7.5 0 1 1 16.8 6.3"
        stroke={color}
        strokeWidth={2.6}
        fill="none"
        strokeLinecap="round"
      />
      <Path
        d="M17.5 2.5 L17 7 L12.5 6.4"
        stroke={color}
        strokeWidth={2.6}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </HiddenSvg>
  );
}

/** Lightbulb: hint button. */
export function BulbIcon({ size, color = palette.sunEdge }: IconProps) {
  return (
    <HiddenSvg size={size} viewBox="0 0 24 24">
      <Path
        d="M12 2.5 A6.5 6.5 0 0 1 16.5 13.6 Q15.3 14.8 15.3 16.5 H8.7 Q8.7 14.8 7.5 13.6 A6.5 6.5 0 0 1 12 2.5 Z"
        fill={palette.sun}
        stroke={color}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
      <Path d="M9 19 H15 M10 21.5 H14" stroke={palette.bark} strokeWidth={2} strokeLinecap="round" />
    </HiddenSvg>
  );
}
