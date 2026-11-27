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
  /** Card flex-basis in pt. Grow it with the font scale so large text wraps cards, not words. */
  readonly cardBasis?: number;
}

/**
 * Animal row: one selectable card per species with its picture, its home and a corner badge showing how many
 * are left to place (a tick when done, an alert shape when the count is off). The full habitat sentence lives in
 * the accessibility label.
 */
export function SpeciesTray({ tools, selectedId, onSelect, cardBasis = 96 }: SpeciesTrayProps) {
  return (
    <View style={styles.tray} accessibilityRole="toolbar" accessibilityLabel="Animals">
      {tools.map((tool) => {
        const selected = tool.id === selectedId;
        const { placed, target, status } = tool.count;
        const left = Math.max(0, target - placed);
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
            <View style={styles.pictures}>
              <Art artKey={tool.art.artKey} color={tool.art.color} size={44} />
              <View style={styles.divider} />
              <View style={styles.habitats} testID={`tool-${tool.id}-habitats`}>
                {tool.habitats.map((h) => (
                  <Art key={h.artKey} artKey={h.artKey} color={h.color} size={28} />
                ))}
              </View>
            </View>
            <Text style={styles.name}>{tool.art.name}</Text>
            {tool.statusText != null && <Text style={styles.problemText}>{tool.statusText}</Text>}
            <View
              style={[
                styles.badge,
                status === 'satisfied' && styles.badgeDone,
                status === 'violated' && styles.badgeProblem,
              ]}
              testID={`tool-${tool.id}-count`}
            >
              {status === 'satisfied' ? (
                <CheckIcon size={16} color="#ffffff" />
              ) : status === 'violated' ? (
                <AlertIcon size={18} />
              ) : (
                <Text style={styles.badgeText}>{left}</Text>
              )}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tray: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingTop: 8, justifyContent: 'center' },
  tool: {
    flexGrow: 1,
    flexShrink: 0,
    maxWidth: 200,
    minHeight: MIN_TOUCH + 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: radii.card,
    borderWidth: 2,
    borderColor: palette.grassEdge,
    backgroundColor: palette.card,
  },
  selected: { borderWidth: 4, borderColor: palette.leaf, backgroundColor: palette.leafSoft },
  pressed: { opacity: 0.85 },
  pictures: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  divider: { width: 1, height: 28, backgroundColor: palette.grassEdge },
  habitats: { flexDirection: 'row', gap: 2 },
  name: { fontSize: 13, fontWeight: '700', color: palette.bark },
  problemText: { fontSize: 12, fontWeight: '600', color: palette.berry },
  badge: {
    position: 'absolute',
    top: -9,
    right: -6,
    minWidth: 26,
    minHeight: 26,
    paddingHorizontal: 6,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.leaf,
    borderWidth: 2,
    borderColor: palette.card,
  },
  badgeDone: { backgroundColor: palette.moss },
  badgeProblem: { backgroundColor: palette.berrySoft, borderColor: palette.berry },
  badgeText: { fontSize: 15, fontWeight: '800', color: '#ffffff', fontVariant: ['tabular-nums'] },
});
