import { Art, MIN_TOUCH, palette, radii } from '@ww/game-ui';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { levelTitle, STRINGS, sizeSpoken, sizeText, tierText } from '../game/labels.ts';
import type { Level } from '../game/levels.ts';
import { speciesArt } from '../game/presentation.ts';

export interface LevelListProps {
  readonly levels: readonly Level[];
  readonly onOpen: (id: string) => void;
}

export function LevelList({ levels, onOpen }: LevelListProps) {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 24,
          paddingLeft: insets.left + 16,
          paddingRight: insets.right + 16,
        },
      ]}
    >
      <Text style={styles.title} accessibilityRole="header">
        {STRINGS.appTitle}
      </Text>
      <Text style={styles.intro}>{STRINGS.levelsIntro}</Text>
      <Text style={styles.heading} accessibilityRole="header">
        {STRINGS.levelsHeading}
      </Text>
      {levels.map((level) => {
        const { rows, columns, difficulty } = level.definition;
        const tier = tierText(difficulty?.tier);
        return (
          <Pressable
            key={level.id}
            testID={`level-${level.id}`}
            onPress={() => onOpen(level.id)}
            accessibilityRole="button"
            accessibilityLabel={`${levelTitle(level.number)}, ${level.id}, ${sizeSpoken(rows, columns)}, ${tier}`}
            style={({ pressed }) => [styles.card, pressed && styles.pressed]}
          >
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{level.number}</Text>
            </View>
            <View style={styles.body}>
              <Text style={styles.name}>{levelTitle(level.number)}</Text>
              <Text style={styles.meta}>
                {sizeText(rows, columns)} · {tier} · {level.id}
              </Text>
              <View style={styles.animals}>
                {level.puzzle.species.map((id) => {
                  const art = speciesArt(id);
                  return <Art key={id} artKey={art.artKey} color={art.color} size={22} />;
                })}
              </View>
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.paper },
  content: { gap: 12, maxWidth: 640, width: '100%', alignSelf: 'center' },
  title: { fontSize: 30, fontWeight: '800', color: palette.bark },
  intro: { fontSize: 16, lineHeight: 22, color: palette.barkSoft },
  heading: { fontSize: 18, fontWeight: '700', color: palette.bark, marginTop: 8 },
  card: {
    minHeight: MIN_TOUCH + 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: radii.card,
    borderWidth: 2,
    borderColor: palette.grassEdge,
    backgroundColor: palette.card,
  },
  pressed: { opacity: 0.85 },
  badge: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.mossSoft,
    borderWidth: 2,
    borderColor: palette.moss,
  },
  badgeText: { fontSize: 18, fontWeight: '800', color: palette.moss },
  body: { flexShrink: 1, gap: 2 },
  name: { fontSize: 18, fontWeight: '700', color: palette.bark },
  meta: { fontSize: 14, color: palette.barkSoft },
  animals: { flexDirection: 'row', gap: 6, marginTop: 4 },
});
