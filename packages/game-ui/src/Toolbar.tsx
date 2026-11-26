import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { EmptyMarkIcon, HintIcon, RedoIcon, UndoIcon } from './icons.tsx';
import { MIN_TOUCH, palette, radii } from './theme.ts';

export interface ToolbarLabels {
  readonly empty: string;
  readonly undo: string;
  readonly redo: string;
  readonly hint: string;
  readonly hintSoon: string;
}

export const DEFAULT_TOOLBAR_LABELS: ToolbarLabels = {
  empty: 'Mark empty',
  undo: 'Undo',
  redo: 'Redo',
  hint: 'Hint',
  hintSoon: 'Coming soon',
};

export interface ToolbarProps {
  readonly emptySelected: boolean;
  readonly canUndo: boolean;
  readonly canRedo: boolean;
  readonly onSelectEmpty: () => void;
  readonly onUndo: () => void;
  readonly onRedo: () => void;
  /** Show a disabled "coming soon" hint slot. */
  readonly showHintSlot?: boolean;
  readonly labels?: ToolbarLabels;
}

interface ButtonProps {
  readonly testID: string;
  readonly label: string;
  readonly sublabel?: string;
  readonly icon: ReactNode;
  readonly onPress?: () => void;
  readonly disabled?: boolean;
  readonly selected?: boolean;
}

function ToolButton({ testID, label, sublabel, icon, onPress, disabled = false, selected }: ButtonProps) {
  const a11yLabel = sublabel ? `${label}, ${sublabel}` : label;
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={a11yLabel}
      accessibilityState={selected === undefined ? { disabled } : { disabled, selected }}
      style={({ pressed }) => [
        styles.button,
        selected && styles.selected,
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      {icon}
      <Text style={[styles.label, disabled && styles.labelDisabled]}>{label}</Text>
      {sublabel != null && <Text style={styles.sublabel}>{sublabel}</Text>}
    </Pressable>
  );
}

/** Bottom tools: empty-mark tool, undo, redo and an optional disabled hint slot. */
export function Toolbar({
  emptySelected,
  canUndo,
  canRedo,
  onSelectEmpty,
  onUndo,
  onRedo,
  showHintSlot = true,
  labels = DEFAULT_TOOLBAR_LABELS,
}: ToolbarProps) {
  const muted = palette.barkSoft;
  return (
    <View style={styles.bar} accessibilityRole="toolbar">
      <ToolButton
        testID="tool-empty"
        label={labels.empty}
        icon={<EmptyMarkIcon size={24} />}
        onPress={onSelectEmpty}
        selected={emptySelected}
      />
      <ToolButton
        testID="action-undo"
        label={labels.undo}
        icon={<UndoIcon size={24} color={canUndo ? palette.bark : muted} />}
        onPress={onUndo}
        disabled={!canUndo}
      />
      <ToolButton
        testID="action-redo"
        label={labels.redo}
        icon={<RedoIcon size={24} color={canRedo ? palette.bark : muted} />}
        onPress={onRedo}
        disabled={!canRedo}
      />
      {showHintSlot && (
        <ToolButton
          testID="action-hint"
          label={labels.hint}
          sublabel={labels.hintSoon}
          icon={<HintIcon size={24} />}
          disabled
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  button: {
    flexGrow: 1,
    flexBasis: 72,
    minHeight: MIN_TOUCH + 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: radii.card,
    borderWidth: 2,
    borderColor: palette.grassEdge,
    backgroundColor: palette.card,
  },
  selected: { borderWidth: 3, borderColor: palette.honey, backgroundColor: palette.honeySoft },
  disabled: { backgroundColor: palette.paper, borderStyle: 'dashed' },
  pressed: { opacity: 0.85 },
  label: { fontSize: 13, fontWeight: '700', color: palette.bark, textAlign: 'center' },
  labelDisabled: { color: palette.barkSoft },
  sublabel: { fontSize: 11, color: palette.barkSoft, textAlign: 'center' },
});
