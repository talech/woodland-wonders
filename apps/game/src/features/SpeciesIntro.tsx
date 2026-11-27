import { Art, MIN_TOUCH, palette, radii } from '@ww/game-ui';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { STRINGS, speciesIntroText } from '../game/labels.ts';
import { habitatArt, speciesArt } from '../game/presentation.ts';

export interface SpeciesIntroProps {
  readonly species: readonly string[];
  /** Habitat ids accepted by each species (from the puzzle's ruleset). */
  readonly homes: Readonly<Record<string, readonly string[]>>;
  readonly onDismiss: () => void;
}

/** One-line card introducing a species the first time it appears (e.g. mouse ↔ mushroom). */
export function SpeciesIntro({ species, homes, onDismiss }: SpeciesIntroProps) {
  return (
    <View style={styles.card} testID="species-intro" accessibilityLiveRegion="polite">
      {species.map((id) => {
        const art = speciesArt(id);
        const habitats = (homes[id] ?? []).map(habitatArt);
        return (
          <View
            key={id}
            style={styles.row}
            accessible
            accessibilityLabel={speciesIntroText(id, homes[id] ?? [])}
          >
            <Art artKey={art.artKey} color={art.color} size={32} />
            {habitats.map((h) => (
              <Art key={h.artKey} artKey={h.artKey} color={h.color} size={26} />
            ))}
            <Text style={styles.text}>{speciesIntroText(id, homes[id] ?? [])}</Text>
          </View>
        );
      })}
      <Pressable
        testID="species-intro-dismiss"
        onPress={onDismiss}
        accessibilityRole="button"
        accessibilityLabel={STRINGS.gotIt}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      >
        <Text style={styles.buttonText}>{STRINGS.gotIt}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 8,
    padding: 12,
    borderRadius: radii.card,
    borderWidth: 2,
    borderColor: palette.honey,
    backgroundColor: palette.honeySoft,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  text: { flexShrink: 1, fontSize: 15, fontWeight: '600', color: palette.bark },
  button: {
    alignSelf: 'flex-end',
    minHeight: MIN_TOUCH,
    minWidth: 96,
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderRadius: radii.pill,
    borderWidth: 2,
    borderColor: palette.bark,
    backgroundColor: palette.card,
  },
  pressed: { opacity: 0.85 },
  buttonText: { fontSize: 15, fontWeight: '700', color: palette.bark, textAlign: 'center' },
});
