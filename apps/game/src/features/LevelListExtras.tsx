import { HintIcon, MIN_TOUCH, palette, radii } from '@ww/game-ui';
import { Pressable, StyleSheet, Text } from 'react-native';
import { STRINGS } from '../game/labels.ts';

export function LevelListExtras({ onHowToPlay }: { onHowToPlay: () => void }) {
  return (
    <Pressable
      testID="how-to-play"
      onPress={onHowToPlay}
      accessibilityRole="button"
      accessibilityLabel={STRINGS.howToPlay}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <HintIcon size={22} color={palette.sky} />
      <Text style={styles.text}>{STRINGS.howToPlay}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: MIN_TOUCH,
    paddingHorizontal: 16,
    borderRadius: radii.pill,
    borderWidth: 2,
    borderColor: palette.sky,
    backgroundColor: palette.card,
  },
  pressed: { opacity: 0.85 },
  text: { fontSize: 16, fontWeight: '700', color: palette.sky },
});
