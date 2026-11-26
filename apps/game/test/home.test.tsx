import { render, screen } from '@testing-library/react-native';
import Home from '../src/app/index';

describe('Home shell', () => {
  it('renders the validated catalog count', async () => {
    await render(<Home />);
    expect(await screen.findByText('Woodland Wonders')).toBeTruthy();
    expect(screen.getByTestId('catalog-count').props.children).toEqual([4, ' puzzles ready']);
  });
});
