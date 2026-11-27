import { BackIcon, MIN_TOUCH, palette, radii } from '@ww/game-ui';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { STRINGS } from '../game/labels.ts';

export interface ScreenHeaderProps {
  readonly title: string;
  readonly subtitle?: string;
  readonly onBack: () => void;
  /** Optional trailing action (e.g. Reset). */
  readonly action?: {
    readonly label: string;
    readonly accessibilityLabel: string;
    readonly onPress: () => void;
  };
}

export function ScreenHeader({ title, subtitle, onBack, action }: ScreenHeaderProps) {
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
      {action && (
        <Pressable
          testID="header-action"
          onPress={action.onPress}
          accessibilityRole="button"
          accessibilityLabel={action.accessibilityLabel}
          style={({ pressed }) => [styles.action, pressed && styles.pressed]}
        >
          <Text style={styles.actionText}>{action.label}</Text>
        </Pressable>
      )}
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
  titles: { flexShrink: 1, flexGrow: 1 },
  action: {
    minHeight: MIN_TOUCH,
    minWidth: MIN_TOUCH,
    paddingHorizontal: 14,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.card,
    borderWidth: 2,
    borderColor: palette.grassEdge,
  },
  actionText: { fontSize: 15, fontWeight: '700', color: palette.bark },
  title: { fontSize: 22, fontWeight: '800', color: palette.bark },
  subtitle: { fontSize: 14, color: palette.barkSoft },
});
