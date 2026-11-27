/**
 * Self-authored placeholder art (CC0, see assets/PROVENANCE.md). Each drawing has a distinct silhouette so
 * species and habitats are distinguishable without colour. Keyed by the `artKey` from presentation config so
 * assets stay replaceable and gameplay code never references a drawing directly.
 */
import type { ReactElement } from 'react';
import { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import { HiddenSvg } from './HiddenSvg.tsx';

type Drawing = (color: string) => ReactElement;

const INK = '#5b3a26';
const SW = 2.6;
const CREAM = '#fff3df';
const BLUSH = '#f4a6a0';

/** Shiny bead eye: dark ellipse with a white highlight. */
const eye = (cx: number, cy: number) => (
  <G>
    <Ellipse cx={cx} cy={cy} rx={4.6} ry={5.6} fill={INK} />
    <Circle cx={cx - 1.5} cy={cy - 2} r={1.7} fill="#ffffff" />
  </G>
);

const fox: Drawing = (color) => (
  <G>
    {/* tiny body and stub feet */}
    <Ellipse cx={50} cy={86} rx={20} ry={11} fill={color} stroke={INK} strokeWidth={SW} />
    <Ellipse cx={50} cy={88} rx={10} ry={7} fill={CREAM} />
    <Ellipse cx={37} cy={95} rx={7} ry={3.6} fill="#8a4a22" />
    <Ellipse cx={63} cy={95} rx={7} ry={3.6} fill="#8a4a22" />
    {/* ears */}
    <Path d="M15 42 L17 9 L44 26 Z" fill={color} stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
    <Path d="M85 42 L83 9 L56 26 Z" fill={color} stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
    <Path d="M22 34 L23 18 L35 27 Z" fill="#f3b9a0" />
    <Path d="M78 34 L77 18 L65 27 Z" fill="#f3b9a0" />
    {/* big head with creamy muzzle */}
    <Ellipse cx={50} cy={50} rx={37} ry={29} fill={color} stroke={INK} strokeWidth={SW} />
    <Path d="M16 56 Q50 38 84 56 Q76 78 50 78 Q24 78 16 56 Z" fill={CREAM} />
    {eye(35, 49)}
    {eye(65, 49)}
    <Circle cx={25} cy={60} r={4} fill={BLUSH} opacity={0.75} />
    <Circle cx={75} cy={60} r={4} fill={BLUSH} opacity={0.75} />
    <Ellipse cx={50} cy={60} rx={4.2} ry={3.2} fill={INK} />
    <Path d="M45 66 Q50 70 55 66" stroke={INK} strokeWidth={2} fill="none" strokeLinecap="round" />
  </G>
);

const mouse: Drawing = (color) => (
  <G>
    {/* tail and body */}
    <Path d="M68 88 Q92 86 90 68" stroke={INK} strokeWidth={SW + 1} fill="none" strokeLinecap="round" />
    <Ellipse cx={50} cy={86} rx={19} ry={11} fill={color} stroke={INK} strokeWidth={SW} />
    <Ellipse cx={50} cy={88} rx={9} ry={6.5} fill="#f7ecee" />
    <Ellipse cx={38} cy={95} rx={6.5} ry={3.4} fill="#e8b4b8" />
    <Ellipse cx={62} cy={95} rx={6.5} ry={3.4} fill="#e8b4b8" />
    {/* big round ears */}
    <Circle cx={24} cy={28} r={19} fill={color} stroke={INK} strokeWidth={SW} />
    <Circle cx={76} cy={28} r={19} fill={color} stroke={INK} strokeWidth={SW} />
    <Circle cx={24} cy={28} r={11} fill="#f4b6c0" />
    <Circle cx={76} cy={28} r={11} fill="#f4b6c0" />
    {/* head */}
    <Ellipse cx={50} cy={54} rx={34} ry={28} fill={color} stroke={INK} strokeWidth={SW} />
    {eye(37, 52)}
    {eye(63, 52)}
    <Circle cx={27} cy={62} r={4} fill={BLUSH} opacity={0.75} />
    <Circle cx={73} cy={62} r={4} fill={BLUSH} opacity={0.75} />
    <Ellipse cx={50} cy={62} rx={4.6} ry={3.6} fill="#e98fa0" stroke={INK} strokeWidth={1.6} />
    <Path d="M45 69 Q50 73 55 69" stroke={INK} strokeWidth={2} fill="none" strokeLinecap="round" />
    <Path d="M22 62 L10 59 M22 67 L10 69 M78 62 L90 59 M78 67 L90 69" stroke={INK} strokeWidth={1.6} />
  </G>
);

const rabbit: Drawing = (color) => (
  <G>
    <Ellipse cx={50} cy={87} rx={19} ry={10} fill={color} stroke={INK} strokeWidth={SW} />
    <Ellipse cx={50} cy={89} rx={9} ry={6} fill={CREAM} />
    <Ellipse cx={37} cy={96} rx={7} ry={3.4} fill={CREAM} stroke={INK} strokeWidth={1.6} />
    <Ellipse cx={63} cy={96} rx={7} ry={3.4} fill={CREAM} stroke={INK} strokeWidth={1.6} />
    {/* tall ears */}
    <Ellipse cx={35} cy={22} rx={10} ry={22} fill={color} stroke={INK} strokeWidth={SW} />
    <Ellipse cx={65} cy={22} rx={10} ry={22} fill={color} stroke={INK} strokeWidth={SW} />
    <Ellipse cx={35} cy={25} rx={5} ry={15} fill="#f4b6c0" />
    <Ellipse cx={65} cy={25} rx={5} ry={15} fill="#f4b6c0" />
    <Ellipse cx={50} cy={60} rx={33} ry={25} fill={color} stroke={INK} strokeWidth={SW} />
    {eye(37, 58)}
    {eye(63, 58)}
    <Circle cx={27} cy={67} r={4} fill={BLUSH} opacity={0.75} />
    <Circle cx={73} cy={67} r={4} fill={BLUSH} opacity={0.75} />
    <Ellipse cx={50} cy={66} rx={3.8} ry={3} fill="#e98fa0" stroke={INK} strokeWidth={1.4} />
    <Path
      d="M50 69 L50 72 M44 74 Q50 77 50 72 Q50 77 56 74"
      stroke={INK}
      strokeWidth={1.8}
      fill="none"
      strokeLinecap="round"
    />
    <Rect x={46.5} y={74} width={7} height={6} rx={2} fill="#ffffff" stroke={INK} strokeWidth={1.4} />
  </G>
);

const tree: Drawing = (color) => (
  <G>
    <Rect x={43} y={74} width={14} height={20} rx={5} fill="#8a5d3a" stroke={INK} strokeWidth={SW} />
    <Path
      d="M50 38 Q70 56 84 74 Q90 82 78 82 H22 Q10 82 16 74 Q30 56 50 38 Z"
      fill={color}
      stroke={INK}
      strokeWidth={SW}
      strokeLinejoin="round"
    />
    <Path
      d="M50 22 Q68 42 80 58 Q86 66 76 66 H24 Q14 66 20 58 Q32 42 50 22 Z"
      fill={color}
      stroke={INK}
      strokeWidth={SW}
      strokeLinejoin="round"
    />
    <Path
      d="M50 6 Q64 24 74 40 Q80 48 70 48 H30 Q20 48 26 40 Q36 24 50 6 Z"
      fill={color}
      stroke={INK}
      strokeWidth={SW}
      strokeLinejoin="round"
    />
    <Path
      d="M40 32 Q46 22 50 16 M32 54 Q40 46 44 40 M28 72 Q36 64 40 58"
      stroke="#ffffff"
      strokeOpacity={0.35}
      strokeWidth={3}
      fill="none"
      strokeLinecap="round"
    />
  </G>
);

const mushroom: Drawing = (color) => (
  <G>
    <Path
      d="M33 58 Q30 92 50 92 Q70 92 67 58 Z"
      fill="#fbf1de"
      stroke={INK}
      strokeWidth={SW}
      strokeLinejoin="round"
    />
    <Path
      d="M8 58 Q6 12 50 12 Q94 12 92 58 Q92 66 80 66 H20 Q8 66 8 58 Z"
      fill={color}
      stroke={INK}
      strokeWidth={SW}
      strokeLinejoin="round"
    />
    <Circle cx={30} cy={36} r={8} fill="#fff6ea" />
    <Circle cx={58} cy={28} r={7} fill="#fff6ea" />
    <Circle cx={74} cy={46} r={6} fill="#fff6ea" />
    <Circle cx={44} cy={52} r={4.5} fill="#fff6ea" />
  </G>
);

const burrow: Drawing = (color) => (
  <G>
    <Path
      d="M6 86 Q10 28 50 26 Q90 28 94 86 Z"
      fill={color}
      stroke={INK}
      strokeWidth={SW}
      strokeLinejoin="round"
    />
    <Path d="M28 86 Q30 50 50 48 Q70 50 72 86 Z" fill="#3a281c" />
    <Path d="M36 86 Q38 62 50 60 Q62 62 64 86 Z" fill="#5a3f2b" />
    <Path d="M14 88 L86 88" stroke={INK} strokeWidth={SW} strokeLinecap="round" />
    <Path
      d="M16 40 Q20 32 24 40 M72 34 Q78 26 82 36"
      stroke="#ffffff"
      strokeOpacity={0.4}
      strokeWidth={3}
      fill="none"
      strokeLinecap="round"
    />
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
