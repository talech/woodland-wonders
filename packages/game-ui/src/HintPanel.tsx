import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AlertIcon, HintIcon } from './icons.tsx';
import { MIN_TOUCH, palette, radii } from './theme.ts';

export interface HintPanelAction {
  readonly id: string;
  readonly label: string;
  readonly onPress: () => void;
  readonly primary?: boolean;
}

export interface HintPanelStep {
  readonly key: string;
  readonly text: string;
}

export interface HintPanelProps {
  /** `hint`: a deduction to follow · `conflict`: the board cannot be completed · `info`: solved / stuck. */
  readonly tone: 'hint' | 'conflict' | 'info';
  readonly title: string;
  /** Paragraphs, in reading order. */
  readonly body: readonly string[];
  /** Numbered reasoning steps (stage 2), with stable keys. */
  readonly steps?: readonly HintPanelStep[];
  /** Final sentence, emphasised (e.g. the concluded cell). */
  readonly conclusion?: string;
  readonly actions: readonly HintPanelAction[];
  readonly dismissLabel: string;
  readonly onDismiss: () => void;
  /** Fixed panel height so the board only resizes when the panel opens or closes. */
  readonly height: number;
}

/**
 * Gentle hint panel. Content scrolls inside a fixed height; actions stay pinned at the bottom.
 * The tone is shown with an icon and title, not colour alone.
 */
export function HintPanel({
  tone,
  title,
  body,
  steps = [],
  conclusion,
  actions,
  dismissLabel,
  onDismiss,
  height,
}: HintPanelProps) {
  const accent = tone === 'conflict' ? palette.berry : palette.sky;
  return (
    <View
      testID="hint-panel"
      accessibilityLiveRegion="polite"
      style={[styles.panel, { height, borderColor: accent }]}
    >
      <View style={styles.titleRow}>
        {tone === 'conflict' ? <AlertIcon size={22} /> : <HintIcon size={22} color={palette.sky} />}
        <Text style={styles.title} accessibilityRole="header">
          {title}
        </Text>
        <Pressable
          testID="hint-dismiss"
          onPress={onDismiss}
          accessibilityRole="button"
          accessibilityLabel={dismissLabel}
          hitSlop={8}
          style={({ pressed }) => [styles.close, pressed && styles.pressed]}
        >
          <Text style={styles.closeText} importantForAccessibility="no" accessibilityElementsHidden>
            ×
          </Text>
        </Pressable>
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} testID="hint-scroll">
        {body.map((p) => (
          <Text key={p} style={styles.body}>
            {p}
          </Text>
        ))}
        {steps.map((s, i) => (
          <View key={s.key} style={styles.stepRow}>
            <Text style={styles.stepNumber}>{i + 1}.</Text>
            <Text style={styles.stepText}>{s.text}</Text>
          </View>
        ))}
        {conclusion != null && <Text style={styles.conclusion}>{conclusion}</Text>}
      </ScrollView>
      {actions.length > 0 && (
        <View style={styles.actions}>
          {actions.map((a) => (
            <Pressable
              key={a.id}
              testID={`hint-action-${a.id}`}
              onPress={a.onPress}
              accessibilityRole="button"
              accessibilityLabel={a.label}
              style={({ pressed }) => [
                styles.button,
                { borderColor: accent },
                a.primary && { backgroundColor: accent },
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.buttonText, { color: a.primary ? palette.card : accent }]}>{a.label}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderWidth: 2,
    borderRadius: radii.card,
    backgroundColor: palette.card,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { flex: 1, fontSize: 16, fontWeight: '800', color: palette.bark },
  close: {
    width: 36,
    height: 36,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.paper,
  },
  closeText: { fontSize: 22, lineHeight: 24, color: palette.bark, fontWeight: '700' },
  scroll: { flex: 1 },
  scrollContent: { gap: 6 },
  body: { fontSize: 14, lineHeight: 20, color: palette.bark },
  stepRow: { flexDirection: 'row', gap: 6 },
  stepNumber: { fontSize: 14, lineHeight: 20, fontWeight: '700', color: palette.barkSoft },
  stepText: { flex: 1, fontSize: 14, lineHeight: 20, color: palette.bark },
  conclusion: { fontSize: 15, lineHeight: 21, fontWeight: '700', color: palette.bark },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  button: {
    flexGrow: 1,
    flexShrink: 1,
    maxWidth: '100%',
    paddingVertical: 6,
    minHeight: MIN_TOUCH - 4,
    paddingHorizontal: 14,
    justifyContent: 'center',
    borderRadius: radii.pill,
    borderWidth: 2,
    backgroundColor: palette.card,
  },
  pressed: { opacity: 0.85 },
  buttonText: { fontSize: 15, fontWeight: '700', textAlign: 'center' },
});
