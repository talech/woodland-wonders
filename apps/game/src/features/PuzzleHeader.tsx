import { BackIcon, GearIcon, MIN_TOUCH, palette, radii } from '@ww/game-ui';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { STRINGS } from '../game/labels.ts';

export interface PuzzleHeaderProps {
  readonly title: string;
  readonly subtitle?: string;
  readonly onBack: () => void;
  /** Opens help (How to play). The gear is omitted when not provided. */
  readonly onHelp?: () => void;
}

/** Compact puzzle header: round back button, centred level plaque, round help button. */
export function PuzzleHeader({ title, subtitle, onBack, onHelp }: PuzzleHeaderProps) {
  return (
    <View style={styles.header}>
      <Pressable
        testID="header-back"
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel={STRINGS.back}
        style={({ pressed }) => [styles.round, pressed && styles.pressed]}
      >
        <BackIcon size={26} />
      </Pressable>
      <View style={styles.plaque}>
        <Text style={styles.title} accessibilityRole="header">
          {title}
        </Text>
        {subtitle != null && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      {onHelp ? (
        <Pressable
          testID="header-help"
          onPress={onHelp}
          accessibilityRole="button"
          accessibilityLabel={STRINGS.howToPlay}
          style={({ pressed }) => [styles.round, pressed && styles.pressed]}
        >
          <GearIcon size={26} />
        </Pressable>
      ) : (
        <View style={styles.round} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  round: {
    width: MIN_TOUCH,
    height: MIN_TOUCH,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.card,
    borderWidth: 2,
    borderColor: palette.grassEdge,
  },
  pressed: { opacity: 0.8 },
  plaque: {
    flexShrink: 1,
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: 4,
    borderRadius: radii.card,
    backgroundColor: palette.card,
    borderWidth: 2,
    borderColor: palette.grassEdge,
  },
  title: { fontSize: 22, fontWeight: '800', color: palette.bark, textAlign: 'center' },
  subtitle: { fontSize: 14, color: palette.barkSoft, textAlign: 'center' },
});
