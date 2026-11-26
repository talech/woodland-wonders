import { BackIcon, MIN_TOUCH, palette, radii } from '@ww/game-ui';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { STRINGS } from '../game/labels.ts';

export interface ScreenHeaderProps {
  readonly title: string;
  readonly subtitle?: string;
  readonly onBack: () => void;
}

export function ScreenHeader({ title, subtitle, onBack }: ScreenHeaderProps) {
  return (
    <View style={styles.header}>
      <Pressable
        testID="header-back"
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel={STRINGS.back}
        hitSlop={4}
        style={({ pressed }) => [styles.back, pressed && styles.pressed]}
      >
        <BackIcon size={26} />
      </Pressable>
      <View style={styles.titles}>
        <Text style={styles.title} accessibilityRole="header">
          {title}
        </Text>
        {subtitle != null && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  back: {
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
  titles: { flexShrink: 1 },
  title: { fontSize: 22, fontWeight: '800', color: palette.bark },
  subtitle: { fontSize: 14, color: palette.barkSoft },
});
