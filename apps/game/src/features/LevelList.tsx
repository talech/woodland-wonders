import { Art, CheckIcon, MIN_TOUCH, palette, radii, SparkleIcon } from '@ww/game-ui';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { levelLabel, levelTitle, STRINGS, sizeText, tierText } from '../game/labels.ts';
import { groupByTier, type Level, type LevelStatus } from '../game/levels.ts';
import { speciesArt } from '../game/presentation.ts';

export interface LevelListProps {
  readonly levels: readonly Level[];
  readonly statuses: Readonly<Record<string, LevelStatus>>;
  /** Gentle suggestion (never a lock): the next unsolved level, or null when all are complete. */
  readonly suggestedId: string | null;
  readonly onOpen: (id: string) => void;
  /** Extra content shown under the intro (onboarding card, "How to play"). */
  readonly extra?: ReactNode;
}

function StatusBadge({ status }: { status: LevelStatus }) {
  if (status === 'new') return null;
  const done = status === 'completed';
  return (
    <View style={[styles.status, done ? styles.statusDone : styles.statusProgress]}>
      {done ? <CheckIcon size={16} /> : <View style={styles.progressDot} />}
      <Text style={[styles.statusText, done && styles.statusTextDone]}>
        {done ? STRINGS.completed : STRINGS.inProgress}
      </Text>
    </View>
  );
}

export function LevelList({ levels, statuses, suggestedId, onOpen, extra }: LevelListProps) {
  const insets = useSafeAreaInsets();
  const suggested = suggestedId === null ? undefined : levels.find((l) => l.id === suggestedId);
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
      {extra}
      {suggested ? (
        <Pressable
          testID="continue"
          onPress={() => onOpen(suggested.id)}
          accessibilityRole="button"
          accessibilityLabel={`${STRINGS.continue}: ${levelTitle(suggested.number)}`}
          style={({ pressed }) => [styles.continue, pressed && styles.pressed]}
        >
          <Text style={styles.continueText}>
            {STRINGS.continue}: {levelTitle(suggested.number)}
          </Text>
        </Pressable>
      ) : (
        <View style={styles.allDone} testID="all-complete">
          <CheckIcon size={22} />
          <Text style={styles.allDoneText}>{STRINGS.allComplete}</Text>
        </View>
      )}
      {groupByTier(levels).map((group) => (
        <View key={group.tier} style={styles.group}>
          <Text style={styles.heading} accessibilityRole="header">
            {tierText(group.tier)}
          </Text>
          {group.levels.map((level) => {
            const { rows, columns, difficulty } = level.definition;
            const status = statuses[level.id] ?? 'new';
            const isSuggested = level.id === suggestedId;
            return (
              <Pressable
                key={level.id}
                testID={`level-${level.id}`}
                onPress={() => onOpen(level.id)}
                accessibilityRole="button"
                accessibilityLabel={levelLabel(
                  level.number,
                  difficulty?.tier,
                  status,
                  rows,
                  columns,
                  isSuggested,
                )}
                style={({ pressed }) => [
                  styles.card,
                  status === 'completed' && styles.cardDone,
                  isSuggested && styles.cardSuggested,
                  pressed && styles.pressed,
                ]}
              >
                {/* Decorative number disc (the card label says "Level N"); clamped so it fits its circle. */}
                <View
                  style={[styles.badge, status === 'completed' && styles.badgeDone]}
                  accessibilityElementsHidden
                  importantForAccessibility="no-hide-descendants"
                >
                  <Text style={styles.badgeText} maxFontSizeMultiplier={1.3}>
                    {level.number}
                  </Text>
                </View>
                <View style={styles.body}>
                  <View style={styles.nameRow}>
                    <Text style={styles.name}>{levelTitle(level.number)}</Text>
                    {isSuggested && (
                      <View style={styles.nextUp}>
                        <SparkleIcon size={14} />
                        <Text style={styles.nextUpText}>{STRINGS.nextUp}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.meta}>{sizeText(rows, columns)}</Text>
                  <View style={styles.footer}>
                    <View style={styles.animals}>
                      {level.puzzle.species.map((id) => {
                        const art = speciesArt(id);
                        return <Art key={id} artKey={art.artKey} color={art.color} size={22} />;
                      })}
                    </View>
                    <StatusBadge status={status} />
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.paper },
  content: { gap: 12, maxWidth: 640, width: '100%', alignSelf: 'center' },
  title: { fontSize: 30, fontWeight: '800', color: palette.bark },
  intro: { fontSize: 16, lineHeight: 22, color: palette.barkSoft },
  continue: {
    minHeight: MIN_TOUCH + 4,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: radii.pill,
    backgroundColor: palette.moss,
  },
  continueText: { fontSize: 18, fontWeight: '800', color: palette.card, textAlign: 'center' },
  allDone: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: radii.card,
    backgroundColor: palette.mossSoft,
  },
  allDoneText: { flexShrink: 1, fontSize: 15, color: palette.bark },
  group: { gap: 10 },
  heading: { fontSize: 20, fontWeight: '800', color: palette.bark, marginTop: 8 },
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
  cardDone: { backgroundColor: palette.mossSoft },
  cardSuggested: { borderWidth: 3, borderColor: palette.honey, backgroundColor: palette.honeySoft },
  pressed: { opacity: 0.85 },
  badge: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.card,
    borderWidth: 2,
    borderColor: palette.moss,
  },
  badgeDone: { backgroundColor: palette.mossSoft },
  badgeText: { fontSize: 18, fontWeight: '800', color: palette.moss },
  body: { flexShrink: 1, flexGrow: 1, gap: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  name: { fontSize: 18, fontWeight: '700', color: palette.bark },
  nextUp: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.pill,
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: palette.honey,
  },
  nextUpText: { fontSize: 13, fontWeight: '700', color: palette.bark },
  meta: { fontSize: 14, color: palette.barkSoft },
  footer: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  animals: { flexDirection: 'row', gap: 6 },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.pill,
  },
  statusDone: { backgroundColor: palette.card },
  statusProgress: { backgroundColor: palette.pebbleSoft },
  progressDot: { width: 10, height: 10, borderRadius: 5, borderWidth: 2, borderColor: palette.barkSoft },
  statusText: { fontSize: 13, fontWeight: '700', color: palette.barkSoft },
  statusTextDone: { color: palette.moss },
});
