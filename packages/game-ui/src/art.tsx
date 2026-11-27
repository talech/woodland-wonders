/**
 * Self-authored placeholder art (CC0, see assets/PROVENANCE.md). Each drawing has a distinct silhouette so
 * species and habitats are distinguishable without colour. Keyed by the `artKey` from presentation config so
 * assets stay replaceable and gameplay code never references a drawing directly.
 */
import type { ReactElement } from 'react';
import { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import { HiddenSvg } from './HiddenSvg.tsx';
import { palette } from './theme.ts';

type Drawing = (color: string) => ReactElement;

const INK = palette.bark;

const fox: Drawing = (color) => (
  <G>
    {/* ears */}
    <Path d="M18 16 L38 40 L22 50 Z" fill={color} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
    <Path d="M82 16 L62 40 L78 50 Z" fill={color} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
    {/* head */}
    <Path
      d="M14 44 Q50 22 86 44 Q84 70 50 88 Q16 70 14 44 Z"
      fill={color}
      stroke={INK}
      strokeWidth={3}
      strokeLinejoin="round"
    />
    {/* cheeks / muzzle */}
    <Path d="M28 60 Q50 66 72 60 Q64 78 50 86 Q36 78 28 60 Z" fill="#fff6ea" />
    <Circle cx={37} cy={52} r={4} fill={INK} />
    <Circle cx={63} cy={52} r={4} fill={INK} />
    <Ellipse cx={50} cy={78} rx={5} ry={4} fill={INK} />
  </G>
);

const mouse: Drawing = (color) => (
  <G>
    {/* big round ears */}
    <Circle cx={26} cy={32} r={18} fill={color} stroke={INK} strokeWidth={3} />
    <Circle cx={74} cy={32} r={18} fill={color} stroke={INK} strokeWidth={3} />
    <Circle cx={26} cy={32} r={9} fill="#f2c4c4" />
    <Circle cx={74} cy={32} r={9} fill="#f2c4c4" />
    {/* head */}
    <Ellipse cx={50} cy={60} rx={30} ry={26} fill={color} stroke={INK} strokeWidth={3} />
    <Circle cx={40} cy={56} r={4} fill={INK} />
    <Circle cx={60} cy={56} r={4} fill={INK} />
    <Circle cx={50} cy={70} r={5} fill="#e59a9a" stroke={INK} strokeWidth={2} />
    {/* whiskers */}
    <Path d="M30 70 L14 66 M30 74 L14 78 M70 70 L86 66 M70 74 L86 78" stroke={INK} strokeWidth={2} />
  </G>
);

const rabbit: Drawing = (color) => (
  <G>
    {/* long upright ears */}
    <Ellipse cx={36} cy={26} rx={9} ry={22} fill={color} stroke={INK} strokeWidth={3} />
    <Ellipse cx={64} cy={26} rx={9} ry={22} fill={color} stroke={INK} strokeWidth={3} />
    <Ellipse cx={36} cy={28} rx={4} ry={14} fill="#f2c4c4" />
    <Ellipse cx={64} cy={28} rx={4} ry={14} fill="#f2c4c4" />
    {/* head */}
    <Circle cx={50} cy={64} r={27} fill={color} stroke={INK} strokeWidth={3} />
    <Circle cx={40} cy={60} r={4} fill={INK} />
    <Circle cx={60} cy={60} r={4} fill={INK} />
    <Path d="M45 72 L50 76 L55 72" stroke={INK} strokeWidth={3} fill="none" strokeLinecap="round" />
    <Rect x={46} y={77} width={8} height={7} rx={2} fill="#fffaf0" stroke={INK} strokeWidth={2} />
  </G>
);

const tree: Drawing = (color) => (
  <G>
    <Rect x={43} y={66} width={14} height={24} rx={4} fill="#7a5638" stroke={INK} strokeWidth={3} />
    <Path d="M50 8 L80 44 L20 44 Z" fill={color} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
    <Path d="M50 26 L88 72 L12 72 Z" fill={color} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
  </G>
);

const mushroom: Drawing = (color) => (
  <G>
    <Path
      d="M38 56 L36 86 Q50 92 64 86 L62 56 Z"
      fill="#fbf1de"
      stroke={INK}
      strokeWidth={3}
      strokeLinejoin="round"
    />
    <Path
      d="M10 58 Q12 16 50 14 Q88 16 90 58 Z"
      fill={color}
      stroke={INK}
      strokeWidth={3}
      strokeLinejoin="round"
    />
    <Circle cx={34} cy={36} r={7} fill="#fff6ea" />
    <Circle cx={60} cy={28} r={6} fill="#fff6ea" />
    <Circle cx={70} cy={46} r={5} fill="#fff6ea" />
  </G>
);

const burrow: Drawing = (color) => (
  <G>
    <Path
      d="M6 84 Q12 30 50 28 Q88 30 94 84 Z"
      fill={color}
      stroke={INK}
      strokeWidth={3}
      strokeLinejoin="round"
    />
    <Path d="M30 84 Q32 52 50 50 Q68 52 70 84 Z" fill="#2f2219" />
    <Path d="M14 84 L86 84" stroke={INK} strokeWidth={3} strokeLinecap="round" />
  </G>
);

const fallback: Drawing = (color) => (
  <Circle cx={50} cy={50} r={36} fill={color} stroke={INK} strokeWidth={3} />
);

const DRAWINGS: Readonly<Record<string, Drawing>> = {
  'species/fox': fox,
  'species/mouse': mouse,
  'species/rabbit': rabbit,
  'habitat/tree': tree,
  'habitat/mushroom': mushroom,
  'habitat/burrow': burrow,
};

/** True when a dedicated drawing exists for `artKey` (otherwise a neutral disc is used). */
export function hasArt(artKey: string): boolean {
  return Object.hasOwn(DRAWINGS, artKey);
}

export interface ArtProps {
  readonly artKey: string;
  readonly color: string;
  readonly size: number;
}

/** Decorative art; callers provide the accessible text. */
export function Art({ artKey, color, size }: ArtProps) {
  const draw = Object.hasOwn(DRAWINGS, artKey) ? (DRAWINGS[artKey] ?? fallback) : fallback;
  return (
    <HiddenSvg size={size} viewBox="0 0 100 100">
      {draw(color)}
    </HiddenSvg>
  );
}
