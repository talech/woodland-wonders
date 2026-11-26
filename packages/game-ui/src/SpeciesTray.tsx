import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Art } from './art.tsx';
import { AlertIcon, CheckIcon } from './icons.tsx';
import { MIN_TOUCH, palette, radii } from './theme.ts';
import type { SpeciesToolModel } from './types.ts';

export interface SpeciesTrayProps {
  readonly tools: readonly SpeciesToolModel[];
  /** Currently selected species tool, or null when another tool (e.g. empty) is active. */
  readonly selectedId: string | null;
  readonly onSelect: (id: string) => void;
}

/**
 * Animal tray: one selectable tool per species with art, glyph, name, placed/target count and habitat hint.
 * Text wraps rather than truncating so large accessibility text sizes stay readable.
 */
export function SpeciesTray({ tools, selectedId, onSelect }: SpeciesTrayProps) {
  return (
    <View style={styles.tray} accessibilityRole="toolbar" accessibilityLabel="Animals">
      {tools.map((tool) => {
        const selected = tool.id === selectedId;
        const { placed, target, status } = tool.count;
        return (
          <Pressable
            key={tool.id}
            testID={`tool-${tool.id}`}
            onPress={() => onSelect(tool.id)}
            accessibilityRole="button"
            accessibilityLabel={tool.accessibilityLabel}
            accessibilityState={{ selected }}
            style={({ pressed }) => [styles.tool, selected && styles.selected, pressed && styles.pressed]}
          >
            <View style={styles.artWrap}>
              <Art artKey={tool.art.artKey} color={tool.art.color} size={40} />
              <Text style={styles.glyph} importantForAccessibility="no" accessibilityElementsHidden>
                {tool.art.glyph}
              </Text>
            </View>
            <View style={styles.body}>
              <Text style={styles.name}>{tool.art.name}</Text>
              <View style={styles.countRow}>
                <Text
                  style={[
                    styles.count,
                    status === 'satisfied' && styles.countDone,
                    status === 'violated' && styles.countProblem,
                  ]}
                >
                  {placed}/{target}
                </Text>
                {status === 'satisfied' && <CheckIcon size={16} />}
                {status === 'violated' && <AlertIcon size={16} />}
                {tool.statusText != null && <Text style={styles.problemText}>{tool.statusText}</Text>}
              </View>
              <View style={styles.hintRow}>
                {tool.habitats.map((h) => (
                  <Art key={h.artKey} artKey={h.artKey} color={h.color} size={18} />
                ))}
                <Text style={styles.hint}>{tool.habitatHint}</Text>
              </View>
            </View>
            {selected && (
              <View style={styles.selectedBadge}>
                <CheckIcon size={18} color={palette.honey} />
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tray: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tool: {
    flexGrow: 1,
    flexBasis: 104,
    minHeight: MIN_TOUCH,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: radii.card,
    borderWidth: 2,
    borderColor: palette.grassEdge,
    backgroundColor: palette.card,
  },
  selected: { borderWidth: 3, borderColor: palette.honey, backgroundColor: palette.honeySoft },
  pressed: { opacity: 0.85 },
  artWrap: { alignItems: 'center' },
  glyph: { fontSize: 12, fontWeight: '800', color: palette.bark },
  body: { flexShrink: 1, gap: 1 },
  name: { fontSize: 15, fontWeight: '700', color: palette.bark },
  countRow: { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
  count: { fontSize: 15, fontWeight: '800', color: palette.bark, fontVariant: ['tabular-nums'] },
  countDone: { color: palette.moss },
  countProblem: { color: palette.berry },
  problemText: { fontSize: 12, fontWeight: '600', color: palette.berry },
  hintRow: { flexDirection: 'row', alignItems: 'center', gap: 3, flexWrap: 'wrap' },
  hint: { fontSize: 12, color: palette.barkSoft, flexShrink: 1 },
  selectedBadge: { position: 'absolute', top: -7, right: -7 },
});
