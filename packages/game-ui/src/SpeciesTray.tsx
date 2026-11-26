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
  /**
   * Compact cards show art, glyph, name, count and habitat icon only; the full habitat hint stays in the
   * accessibility label. Use when cards would be too narrow for the hint sentence.
   */
  readonly compact?: boolean;
  /** Card flex-basis in pt. Grow it with the font scale so large text wraps cards, not words. */
  readonly cardBasis?: number;
}

/**
 * Animal tray: one selectable tool per species. Card content is stacked vertically so names get the full card
 * width; text is never truncated and wraps only at word boundaries.
 */
export function SpeciesTray({
  tools,
  selectedId,
  onSelect,
  compact = false,
  cardBasis = 96,
}: SpeciesTrayProps) {
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
            style={({ pressed }) => [
              styles.tool,
              { flexBasis: cardBasis },
              selected && styles.selected,
              pressed && styles.pressed,
            ]}
          >
            <View style={styles.topRow}>
              <Art artKey={tool.art.artKey} color={tool.art.color} size={30} />
              <Text style={styles.glyph} importantForAccessibility="no" accessibilityElementsHidden>
                {tool.art.glyph}
              </Text>
              <View style={styles.spacer} />
              <View style={styles.habitats} testID={`tool-${tool.id}-habitats`}>
                {tool.habitats.map((h) => (
                  <Art key={h.artKey} artKey={h.artKey} color={h.color} size={18} />
                ))}
              </View>
            </View>
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
            </View>
            {tool.statusText != null && <Text style={styles.problemText}>{tool.statusText}</Text>}
            {!compact && tool.habitatHint !== '' && <Text style={styles.hint}>{tool.habitatHint}</Text>}
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
    flexShrink: 0,
    minHeight: MIN_TOUCH,
    gap: 2,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: radii.card,
    borderWidth: 2,
    borderColor: palette.grassEdge,
    backgroundColor: palette.card,
  },
  selected: { borderWidth: 3, borderColor: palette.honey, backgroundColor: palette.honeySoft },
  pressed: { opacity: 0.85 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  spacer: { flexGrow: 1 },
  glyph: { fontSize: 12, fontWeight: '800', color: palette.bark },
  habitats: { flexDirection: 'row', gap: 2 },
  name: { fontSize: 15, fontWeight: '700', color: palette.bark },
  countRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  count: { fontSize: 15, fontWeight: '800', color: palette.bark, fontVariant: ['tabular-nums'] },
  countDone: { color: palette.moss },
  countProblem: { color: palette.berry },
  problemText: { fontSize: 12, fontWeight: '600', color: palette.berry },
  hint: { fontSize: 12, color: palette.barkSoft },
  selectedBadge: { position: 'absolute', top: -9, right: -9 },
});
