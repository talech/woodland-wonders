import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg';

const LEAF = '#8fc062';
const LEAF_DARK = '#6aa545';
const PETAL = '#f7d54a';

function Leaf({ x, y, r, s = 1, c = LEAF }: { x: number; y: number; r: number; s?: number; c?: string }) {
  return (
    <G transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
      <Path d="M0 0 Q14 -22 0 -46 Q-14 -22 0 0 Z" fill={c} />
      <Path d="M0 -4 L0 -36" stroke="#ffffff" strokeOpacity={0.35} strokeWidth={1.5} />
    </G>
  );
}

function Flower({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`}>
      {[0, 72, 144, 216, 288].map((a) => (
        <Ellipse key={a} cx={0} cy={-9} rx={6} ry={9} fill={PETAL} transform={`rotate(${a})`} />
      ))}
      <Circle cx={0} cy={0} r={5} fill="#f2a93b" />
    </G>
  );
}

/**
 * Soft, decorative foliage for the screen corners. Purely visual: ignores touches and is hidden from assistive
 * technology.
 */
export function Foliage({ width, height }: { readonly width: number; readonly height: number }) {
  return (
    <View
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
      aria-hidden
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      testID="foliage"
    >
      <Svg width={width} height={height} viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice">
        <Leaf x={6} y={96} r={40} s={1.3} />
        <Leaf x={24} y={70} r={10} c={LEAF_DARK} />
        <Leaf x={0} y={60} r={70} s={1.1} />
        <Flower x={30} y={46} s={1.2} />
        <Leaf x={392} y={90} r={-50} s={1.3} />
        <Leaf x={370} y={64} r={-15} c={LEAF_DARK} />
        <Leaf x={0} y={844} r={25} s={1.5} />
        <Leaf x={34} y={844} r={-5} s={1.2} c={LEAF_DARK} />
        <Leaf x={390} y={844} r={-25} s={1.5} />
        <Leaf x={354} y={844} r={5} s={1.2} c={LEAF_DARK} />
      </Svg>
    </View>
  );
}
