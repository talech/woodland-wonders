import { CATALOG, HABITAT_PRESENTATION, SPECIES_PRESENTATION } from '@ww/puzzle-content';
import { WOODLAND_V1 } from '@ww/puzzle-core';
import { useMemo, useReducer, useState } from 'react';
import {
  adoptSolutionClues,
  canRedo,
  canUndo,
  clear,
  clearAnimals,
  commit,
  createDocument,
  createHistory,
  deriveDefinition,
  describeViolation,
  type EditorDocument,
  exportDefinitionJson,
  type History,
  importDefinition,
  importDefinitionJson,
  paint,
  redo,
  resize,
  setMetadata,
  TIERS,
  type Tool,
  undo,
  validateDocument,
} from './model/index.ts';

type Action =
  | { type: 'paint'; cell: number; tool: Tool }
  | { type: 'edit'; fn: (d: EditorDocument) => EditorDocument }
  | { type: 'replace'; doc: EditorDocument }
  | { type: 'undo' }
  | { type: 'redo' };

function reducer(h: History<EditorDocument>, a: Action): History<EditorDocument> {
  switch (a.type) {
    case 'paint':
      return commit(h, paint(h.present, a.cell, a.tool));
    case 'edit':
      return commit(h, a.fn(h.present));
    case 'replace':
      return commit(h, a.doc);
    case 'undo':
      return undo(h);
    case 'redo':
      return redo(h);
  }
}

const glyphOf = (cell: EditorDocument['cells'][number]): string =>
  cell.kind === 'habitat'
    ? (HABITAT_PRESENTATION[cell.habitat]?.glyph ?? '?')
    : cell.kind === 'animal'
      ? (SPECIES_PRESENTATION[cell.species]?.glyph ?? '?')
      : '';

const labelOf = (cell: EditorDocument['cells'][number]): string =>
  cell.kind === 'habitat' ? cell.habitat : cell.kind === 'animal' ? cell.species : 'grass';

function toolKey(t: Tool): string {
  return t.kind === 'erase' ? 'erase' : t.kind === 'habitat' ? `h:${t.habitat}` : `s:${t.species}`;
}

export function App() {
  const [history, dispatch] = useReducer(reducer, undefined, () => createHistory(createDocument(5, 5)));
  const doc = history.present;
  const [tool, setTool] = useState<Tool>({ kind: 'habitat', habitat: 'tree' });
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const report = useMemo(() => validateDocument(doc), [doc]);
  const exported = useMemo(() => exportDefinitionJson(doc), [doc]);
  const clues = deriveDefinition(doc);

  const tools: { tool: Tool; label: string }[] = [
    ...WOODLAND_V1.habitats.map((h) => ({
      tool: { kind: 'habitat', habitat: h } as const,
      label: `${HABITAT_PRESENTATION[h]?.glyph ?? ''} ${h}`,
    })),
    ...WOODLAND_V1.species.map((s) => ({
      tool: { kind: 'species', species: s.id } as const,
      label: `${SPECIES_PRESENTATION[s.id]?.glyph ?? ''} ${s.id}`,
    })),
    { tool: { kind: 'erase' }, label: 'Erase (grass)' },
  ];

  const doImport = (result: ReturnType<typeof importDefinitionJson>) => {
    if (result.ok) {
      dispatch({ type: 'replace', doc: result.value });
      setImportError(null);
    } else setImportError(result.issues.join('\n'));
  };

  return (
    <main className="editor">
      <h1>Puzzle Editor</h1>
      <div className="toolbar">
        <button type="button" disabled={!canUndo(history)} onClick={() => dispatch({ type: 'undo' })}>
          Undo
        </button>
        <button type="button" disabled={!canRedo(history)} onClick={() => dispatch({ type: 'redo' })}>
          Redo
        </button>
        <button type="button" onClick={() => dispatch({ type: 'edit', fn: clearAnimals })}>
          Clear animals
        </button>
        <button type="button" onClick={() => dispatch({ type: 'edit', fn: clear })}>
          Clear all
        </button>
        {doc.clues.mode === 'imported' && (
          <button type="button" onClick={() => dispatch({ type: 'edit', fn: adoptSolutionClues })}>
            Use clues from painted animals
          </button>
        )}
      </div>

      <section aria-label="Metadata" className="meta">
        <label>
          Id{' '}
          <input
            value={doc.id}
            onChange={(e) => dispatch({ type: 'edit', fn: (d) => setMetadata(d, { id: e.target.value }) })}
          />
        </label>
        <label>
          Revision{' '}
          <input
            type="number"
            min={1}
            value={doc.revision}
            onChange={(e) =>
              dispatch({ type: 'edit', fn: (d) => setMetadata(d, { revision: Number(e.target.value) }) })
            }
          />
        </label>
        <label>
          Tier{' '}
          <select
            value={doc.tier}
            onChange={(e) => {
              const tier = TIERS.find((t) => t === e.target.value);
              if (tier) dispatch({ type: 'edit', fn: (d) => setMetadata(d, { tier }) });
            }}
          >
            {TIERS.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
        <label>
          Rows{' '}
          <input
            type="number"
            min={3}
            max={10}
            value={doc.rows}
            onChange={(e) =>
              dispatch({ type: 'edit', fn: (d) => resize(d, Number(e.target.value), d.columns) })
            }
          />
        </label>
        <label>
          Columns{' '}
          <input
            type="number"
            min={3}
            max={10}
            value={doc.columns}
            onChange={(e) => dispatch({ type: 'edit', fn: (d) => resize(d, d.rows, Number(e.target.value)) })}
          />
        </label>
      </section>

      <fieldset aria-label="Palette" className="palette">
        {tools.map((t) => (
          <button
            type="button"
            aria-pressed={toolKey(t.tool) === toolKey(tool)}
            className={toolKey(t.tool) === toolKey(tool) ? 'selected' : ''}
            key={toolKey(t.tool)}
            onClick={() => setTool(t.tool)}
          >
            {t.label}
          </button>
        ))}
      </fieldset>

      <section aria-label="Grid">
        <table className="grid">
          <thead>
            <tr>
              <th aria-label="corner" />
              {clues.columnClues.map((c, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: fixed positional columns
                <th key={i} scope="col" title={`Column ${i} clue`}>
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {clues.rowClues.map((rc, r) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: fixed positional rows
              <tr key={r}>
                <th scope="row" title={`Row ${r} clue`}>
                  {rc}
                </th>
                {Array.from({ length: doc.columns }, (_, c) => {
                  const i = r * doc.columns + c;
                  const cell = doc.cells[i];
                  if (!cell) return null;
                  const bad = report.violationsByCell.has(i);
                  return (
                    <td key={i}>
                      <button
                        type="button"
                        className={`cell ${cell.kind}${bad ? ' bad' : ''}`}
                        aria-label={`Row ${r + 1}, column ${c + 1}: ${labelOf(cell)}${bad ? ', violation' : ''}`}
                        onClick={() => dispatch({ type: 'paint', cell: i, tool })}
                      >
                        {glyphOf(cell)}
                        {bad ? '!' : ''}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        <p>
          Population:{' '}
          {Object.entries(clues.population)
            .map(([s, n]) => `${s} ${n}`)
            .join(', ') || 'none'}
          {doc.clues.mode === 'imported' ? ' (imported clues; repaint the animals)' : ''}
        </p>
      </section>

      <section aria-label="Validation" className="validation">
        <h2>Validation</h2>
        {report.definitionIssues.length > 0 && (
          <ul>
            {report.definitionIssues.map((i) => (
              <li key={i}>Definition: {i}</li>
            ))}
          </ul>
        )}
        {report.violations.length > 0 && (
          <ul>
            {report.violations.map((v) => (
              <li key={`${v.constraintId}:${v.kind}:${v.cells.join(',')}`}>{describeViolation(v)}</li>
            ))}
          </ul>
        )}
        <p role="status">
          {report.definitionIssues.length > 0
            ? 'Definition invalid.'
            : report.solved
              ? 'Definition valid and the painted solution solves it.'
              : 'Definition valid; the painted solution does not solve it.'}
        </p>
      </section>

      <section aria-label="Import and export" className="io">
        <h2>Import</h2>
        <label>
          Paste definition JSON
          <textarea rows={6} value={importText} onChange={(e) => setImportText(e.target.value)} />
        </label>
        <div className="toolbar">
          <button type="button" onClick={() => doImport(importJson(importText))}>
            Import JSON
          </button>
          <label>
            Catalog puzzle{' '}
            <select
              value=""
              onChange={(e) => {
                const def = CATALOG.puzzles.find((p) => p.id === e.target.value);
                if (def) doImport(importDefinition(def));
              }}
            >
              <option value="">choose…</option>
              {CATALOG.puzzles.map((p) => (
                <option key={p.id}>{p.id}</option>
              ))}
            </select>
          </label>
        </div>
        {importError && (
          <pre role="alert" className="error">
            {importError}
          </pre>
        )}
        <h2>Export</h2>
        <label>
          Definition JSON (copy from here)
          <textarea
            rows={10}
            readOnly
            value={exported.ok ? exported.value : `Cannot export:\n${exported.issues.join('\n')}`}
            onFocus={(e) => e.currentTarget.select()}
          />
        </label>
      </section>
    </main>
  );
}

const importJson = importDefinitionJson;
