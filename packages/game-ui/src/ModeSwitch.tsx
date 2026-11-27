import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Art } from './art.tsx';
import { EmptyMarkIcon } from './icons.tsx';
import { MIN_TOUCH, palette, radii } from './theme.ts';
import type { ArtSpec } from './types.ts';

export interface ModeSwitchLabels {
  readonly place: string;
  readonly empty: string;
}

export const DEFAULT_MODE_LABELS: ModeSwitchLabels = { place: 'Place', empty: 'Mark empty' };

export interface ModeSwitchProps {
  /** `place` = a species is the active tool; `empty` = the empty-mark tool. */
  readonly mode: 'place' | 'empty';
  /** Face shown on the Place segment. */
  readonly species: ArtSpec | null;
  readonly onPlace: () => void;
  readonly onEmpty: () => void;
  readonly labels?: ModeSwitchLabels;
}

/** Two-segment switch between placing the chosen animal and marking cells empty. */
export function ModeSwitch({
  mode,
  species,
  onPlace,
  onEmpty,
  labels = DEFAULT_MODE_LABELS,
}: ModeSwitchProps) {
  const placing = mode === 'place';
  return (
    <View style={styles.track} accessibilityRole="radiogroup" testID="mode-switch">
      <Pressable
        testID="mode-place"
        onPress={onPlace}
        accessibilityRole="radio"
        accessibilityLabel={labels.place}
        accessibilityState={{ selected: placing, checked: placing }}
        style={[styles.segment, placing && styles.active]}
      >
        {species && <Art artKey={species.artKey} color={species.color} size={30} />}
        <Text style={[styles.label, placing && styles.labelActive]}>{labels.place}</Text>
      </Pressable>
      <Pressable
        testID="tool-empty"
        onPress={onEmpty}
        accessibilityRole="radio"
        accessibilityLabel={labels.empty}
        accessibilityState={{ selected: !placing, checked: !placing }}
        style={[styles.segment, !placing && styles.active]}
      >
        <EmptyMarkIcon size={22} color={placing ? palette.barkSoft : '#ffffff'} />
        <Text style={[styles.label, !placing && styles.labelActive]}>{labels.empty}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    alignSelf: 'center',
    padding: 4,
    borderRadius: radii.pill,
    backgroundColor: palette.card,
    borderWidth: 2,
    borderColor: palette.grassEdge,
  },
  segment: {
    minHeight: MIN_TOUCH - 4,
    minWidth: 128,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 18,
    borderRadius: radii.pill,
  },
  active: { backgroundColor: palette.leaf },
  label: { fontSize: 16, fontWeight: '700', color: palette.barkSoft },
  labelActive: { color: '#ffffff' },
});
