import { fireEvent, render, screen, within } from '@testing-library/react-native';
import { type SpeciesToolModel, SpeciesTray } from '@ww/game-ui';

const tool = (id: string, name: string, hint: string): SpeciesToolModel => ({
  id,
  art: { artKey: `species/${id}`, color: '#999999', glyph: name[0] ?? '?', name },
  habitatHint: hint,
  habitats: [{ artKey: 'habitat/tree', color: '#336633', glyph: '▲', name: 'Tree' }],
  count: { placed: 0, target: 2, open: 5, status: 'pending' },
  statusText: null,
  accessibilityLabel: `${name}, 0 of 2 placed. ${hint}`,
});

const tools = [
  tool('fox', 'Fox', 'Lives beside a tree (not diagonally)'),
  tool('mouse', 'Mouse', 'Lives beside a mushroom (not diagonally)'),
  tool('rabbit', 'Rabbit', 'Lives beside a burrow (not diagonally)'),
];

describe('SpeciesTray', () => {
  it('shows name, habitat icon and a "left to place" badge; the hint sentence lives in the label', async () => {
    const onSelect = jest.fn();
    await render(<SpeciesTray tools={tools} selectedId="fox" onSelect={onSelect} />);
    expect(screen.queryByText(/Lives beside/)).toBeNull();
    for (const name of ['Fox', 'Mouse', 'Rabbit']) expect(screen.getByText(name)).toBeOnTheScreen();
    expect(screen.getAllByText('2')).toHaveLength(3);
    expect(screen.getByTestId('tool-rabbit-habitats')).toBeOnTheScreen();
    const rabbit = screen.getByRole('button', { name: /^Rabbit, / });
    expect(rabbit).toHaveAccessibleName('Rabbit, 0 of 2 placed. Lives beside a burrow (not diagonally)');
    expect(screen.getByRole('button', { name: /^Fox, / })).toBeSelected();
    await fireEvent.press(rabbit);
    expect(onSelect).toHaveBeenCalledWith('rabbit');
  });

  it('counts down as animals are placed and shows a tick when complete', async () => {
    const half: SpeciesToolModel = {
      ...tool('fox', 'Fox', ''),
      count: { placed: 1, target: 2, open: 3, status: 'pending' },
    };
    const done: SpeciesToolModel = {
      ...tool('mouse', 'Mouse', ''),
      count: { placed: 2, target: 2, open: 0, status: 'satisfied' },
    };
    await render(<SpeciesTray tools={[half, done]} selectedId={null} onSelect={jest.fn()} />);
    expect(within(screen.getByTestId('tool-fox-count')).getByText('1')).toBeOnTheScreen();
    expect(within(screen.getByTestId('tool-mouse-count')).queryByText('0')).toBeNull();
  });

  it('applies the card basis so large text wraps cards rather than words', async () => {
    await render(<SpeciesTray tools={tools} selectedId={null} onSelect={jest.fn()} cardBasis={200} />);
    expect(screen.getByTestId('tool-mouse')).toHaveStyle({ flexBasis: 200 });
  });
});
