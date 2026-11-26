import { fireEvent, render, screen } from '@testing-library/react-native';
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
  tool('fox', 'Fox', 'Lives next to a tree'),
  tool('mouse', 'Mouse', 'Lives next to a mushroom'),
  tool('rabbit', 'Rabbit', 'Lives next to a burrow'),
];

describe('SpeciesTray', () => {
  it('roomy mode shows the hint sentence in each card', async () => {
    await render(<SpeciesTray tools={tools} selectedId="fox" onSelect={jest.fn()} />);
    expect(screen.getByText('Lives next to a burrow')).toBeOnTheScreen();
  });

  it('compact mode keeps name, count and habitat icon; the hint lives in the label', async () => {
    const onSelect = jest.fn();
    await render(<SpeciesTray tools={tools} selectedId="fox" onSelect={onSelect} compact />);
    expect(screen.queryByText(/Lives next to/)).toBeNull();
    for (const name of ['Fox', 'Mouse', 'Rabbit']) expect(screen.getByText(name)).toBeOnTheScreen();
    expect(screen.getAllByText('0/2')).toHaveLength(3);
    expect(screen.getByTestId('tool-rabbit-habitats')).toBeOnTheScreen();
    const rabbit = screen.getByRole('button', { name: /^Rabbit, / });
    expect(rabbit).toHaveAccessibleName('Rabbit, 0 of 2 placed. Lives next to a burrow');
    expect(screen.getByRole('button', { name: /^Fox, / })).toBeSelected();
    await fireEvent.press(rabbit);
    expect(onSelect).toHaveBeenCalledWith('rabbit');
  });

  it('applies the card basis so large text wraps cards rather than words', async () => {
    await render(
      <SpeciesTray tools={tools} selectedId={null} onSelect={jest.fn()} compact cardBasis={200} />,
    );
    expect(screen.getByTestId('tool-mouse')).toHaveStyle({ flexBasis: 200 });
  });
});
