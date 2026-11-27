import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BulbIcon, RedoIcon, ResetIcon, UndoIcon } from './icons.tsx';
import { MIN_TOUCH, palette, radii } from './theme.ts';

export interface ToolbarLabels {
  readonly undo: string;
  readonly redo: string;
  readonly hint: string;
  readonly reset: string;
  /** Spoken name of the reset button (the visible label stays short). */
  readonly resetSpoken: string;
}

export const DEFAULT_TOOLBAR_LABELS: ToolbarLabels = {
  undo: 'Undo',
  redo: 'Redo',
  hint: 'Hint',
  reset: 'Reset',
  resetSpoken: 'Reset puzzle',
};

export interface ToolbarProps {
  readonly canUndo: boolean;
  readonly canRedo: boolean;
  readonly onUndo: () => void;
  readonly onRedo: () => void;
  /** Request a hint. The hint button is omitted when not provided. */
  readonly onHint?: () => void;
  /** A hint is currently shown (selected state on the hint button). */
  readonly hintActive?: boolean;
  /** Ask to clear the board. The reset button is omitted when not provided. */
  readonly onReset?: () => void;
  readonly labels?: ToolbarLabels;
}

interface ButtonProps {
  readonly testID: string;
  readonly label: string;
  readonly spoken?: string;
  readonly icon: ReactNode;
  readonly onPress?: () => void;
  readonly disabled?: boolean;
  readonly selected?: boolean;
  readonly warm?: boolean;
}

function ToolButton({ testID, label, spoken, icon, onPress, disabled = false, selected, warm }: ButtonProps) {
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={spoken ?? label}
      accessibilityState={selected === undefined ? { disabled } : { disabled, selected }}
      style={({ pressed }) => [
        styles.button,
        warm && styles.warm,
        selected && styles.selected,
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      {icon}
      <Text style={[styles.label, disabled && styles.labelDisabled]}>{label}</Text>
    </Pressable>
  );
}

/** Bottom dock: undo, redo, hint and reset. Choosing what a tap does lives in the mode switch and animal row. */
export function Toolbar({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onHint,
  hintActive = false,
  onReset,
  labels = DEFAULT_TOOLBAR_LABELS,
}: ToolbarProps) {
  const muted = palette.barkSoft;
  return (
    <View style={styles.bar} accessibilityRole="toolbar">
      <ToolButton
        testID="action-undo"
        label={labels.undo}
        icon={<UndoIcon size={26} color={canUndo ? palette.bark : muted} />}
        onPress={onUndo}
        disabled={!canUndo}
      />
      <ToolButton
        testID="action-redo"
        label={labels.redo}
        icon={<RedoIcon size={26} color={canRedo ? palette.bark : muted} />}
        onPress={onRedo}
        disabled={!canRedo}
      />
      {onHint && (
        <ToolButton
          testID="action-hint"
          label={labels.hint}
          icon={<BulbIcon size={26} />}
          onPress={onHint}
          selected={hintActive}
          warm
        />
      )}
      {onReset && (
        <ToolButton
          testID="action-reset"
          label={labels.reset}
          spoken={labels.resetSpoken}
          icon={<ResetIcon size={26} />}
          onPress={onReset}
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
    minHeight: MIN_TOUCH + 4,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderRadius: radii.card,
    borderWidth: 2,
    borderColor: palette.grassEdge,
    backgroundColor: palette.card,
  },
  warm: { backgroundColor: palette.sunSoft, borderColor: palette.sunEdge },
  selected: { borderWidth: 3, borderColor: palette.leaf },
  disabled: { backgroundColor: palette.paper, borderStyle: 'dashed' },
  pressed: { opacity: 0.85 },
  label: { fontSize: 14, fontWeight: '700', color: palette.bark, textAlign: 'center' },
  labelDisabled: { color: palette.barkSoft },
});
