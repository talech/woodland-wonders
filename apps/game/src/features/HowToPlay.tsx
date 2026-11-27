import { AlertIcon, Art, EmptyMarkIcon, HintIcon, MIN_TOUCH, palette, radii, UndoIcon } from '@ww/game-ui';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { STRINGS } from '../game/labels.ts';
import { habitatArt, speciesArt } from '../game/presentation.ts';
import { ScreenHeader } from './ScreenHeader.tsx';

const PAIRS = [
  ['fox', 'tree'],
  ['mouse', 'mushroom'],
  ['rabbit', 'burrow'],
] as const;

function A({ id, kind, size = 30 }: { id: string; kind: 'species' | 'habitat'; size?: number }) {
  const art = kind === 'species' ? speciesArt(id) : habitatArt(id);
  return <Art artKey={art.artKey} color={art.color} size={size} />;
}

export const RULES: readonly { readonly text: string; readonly art: ReactNode }[] = [
  {
    text: 'The numbers count the animals in each row and column.',
    art: (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <Text style={{ fontSize: 22, fontWeight: '800', color: palette.bark }}>2</Text>
        <A id="fox" kind="species" />
        <A id="mouse" kind="species" />
      </View>
    ),
  },
  {
    text: 'Every animal lives right next to its home: above, below, left or right. Foxes by trees, mice by mushrooms, rabbits by burrows.',
    art: (
      <View style={{ gap: 2 }}>
        {PAIRS.map(([s, h]) => (
          <View key={s} style={{ flexDirection: 'row', gap: 2 }}>
            <A id={s} kind="species" size={24} />
            <A id={h} kind="habitat" size={24} />
          </View>
        ))}
      </View>
    ),
  },
  {
    text: 'Animals of the same kind never touch, not even corner to corner.',
    art: (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
        <A id="fox" kind="species" />
        <AlertIcon size={18} />
        <A id="fox" kind="species" />
      </View>
    ),
  },
  {
    text: 'Place exactly as many of each animal as the tray shows.',
    art: (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <A id="rabbit" kind="species" />
        <Text style={{ fontSize: 18, fontWeight: '800', color: palette.bark }}>2/2</Text>
      </View>
    ),
  },
  {
    text: 'Different animals may sit side by side, and a home can have many neighbours.',
    art: (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
        <A id="fox" kind="species" />
        <A id="tree" kind="habitat" />
        <A id="fox" kind="species" />
      </View>
    ),
  },
];

const TIPS: readonly { readonly text: string; readonly icon: ReactNode }[] = [
  { text: 'Mark empty rules out cells that can’t hold an animal.', icon: <EmptyMarkIcon size={26} /> },
  { text: 'Undo and Redo take back any move. Nothing is ever locked in.', icon: <UndoIcon size={26} /> },
  {
    text: 'Hint shows the next step and explains why, with no penalty.',
    icon: <HintIcon size={26} color={palette.sky} />,
  },
];

export interface HowToPlayProps {
  readonly onBack: () => void;
  readonly onTutorial: () => void;
}

/** "How to play" reference: the five rules in plain words with small illustrations. */
export function HowToPlay({ onBack, onTutorial }: HowToPlayProps) {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: insets.top + 12,
          paddingBottom: insets.bottom + 24,
          paddingLeft: insets.left + 16,
          paddingRight: insets.right + 16,
        },
      ]}
    >
      <ScreenHeader title={STRINGS.howToPlay} onBack={onBack} />
      {RULES.map((rule, i) => (
        <View
          key={rule.text}
          style={styles.rule}
          accessible
          accessibilityLabel={`Rule ${i + 1}: ${rule.text}`}
        >
          <View style={styles.art}>{rule.art}</View>
          <Text style={styles.ruleText}>
            <Text style={styles.number}>{i + 1}. </Text>
            {rule.text}
          </Text>
        </View>
      ))}
      <Text style={styles.heading} accessibilityRole="header">
        Tools
      </Text>
      {TIPS.map((tip) => (
        <View key={tip.text} style={styles.tip} accessible accessibilityLabel={tip.text}>
          {tip.icon}
          <Text style={styles.tipText}>{tip.text}</Text>
        </View>
      ))}
      <Pressable
        testID="play-tutorial"
        onPress={onTutorial}
        accessibilityRole="button"
        accessibilityLabel={STRINGS.playTutorial}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      >
        <Text style={styles.buttonText}>{STRINGS.playTutorial}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.paper },
  content: { gap: 12, maxWidth: 640, width: '100%', alignSelf: 'center' },
  rule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: radii.card,
    backgroundColor: palette.card,
    borderWidth: 2,
    borderColor: palette.grassEdge,
  },
  art: { minWidth: 72, alignItems: 'center' },
  ruleText: { flexShrink: 1, fontSize: 16, lineHeight: 22, color: palette.bark },
  number: { fontWeight: '800' },
  heading: { fontSize: 20, fontWeight: '800', color: palette.bark, marginTop: 8 },
  tip: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 4 },
  tipText: { flexShrink: 1, fontSize: 15, lineHeight: 21, color: palette.bark },
  button: {
    minHeight: MIN_TOUCH + 4,
    justifyContent: 'center',
    borderRadius: radii.pill,
    backgroundColor: palette.sky,
    paddingHorizontal: 20,
    marginTop: 8,
  },
  pressed: { opacity: 0.85 },
  buttonText: { fontSize: 17, fontWeight: '800', color: palette.card, textAlign: 'center' },
});
