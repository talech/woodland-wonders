import { CATALOG } from '@ww/puzzle-content';
import { createPuzzle } from '@ww/puzzle-core';
import { StyleSheet, Text, View } from 'react-native';

/** M0b shell: proves engine + content wiring through Metro. Lane C replaces it with the real UI. */
export default function Home() {
  const playable = CATALOG.puzzles.filter((def) => createPuzzle(def).ok).length;
  return (
    <View style={styles.container}>
      <Text accessibilityRole="header" style={styles.title}>
        Woodland Wonders
      </Text>
      <Text testID="catalog-count">{playable} puzzles ready</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f4efe3', gap: 8 },
  title: { fontSize: 28, fontWeight: '700', color: '#3d4a2f' },
});
