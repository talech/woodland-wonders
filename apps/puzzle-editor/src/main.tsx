import { CATALOG } from '@ww/puzzle-content';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

/** Developer puzzle editor (dev-only). Lane D replaces this shell. */
function App() {
  return (
    <main>
      <h1>Puzzle Editor</h1>
      <p>{CATALOG.puzzles.length} puzzles in catalog.</p>
    </main>
  );
}

const root = document.getElementById('root');
if (root)
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
