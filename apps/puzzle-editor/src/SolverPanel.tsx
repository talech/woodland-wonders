import type { AnalysisResult, AnalysisView } from './model/index.ts';

interface Props {
  readonly pending: boolean;
  readonly invalid: boolean;
  readonly result: AnalysisResult | null;
  readonly view: AnalysisView;
  readonly onView: (v: AnalysisView) => void;
}

const COUNT_LABEL = {
  zero: '0 solutions',
  one: 'exactly 1 solution',
  multiple: '2+ solutions',
  unknown: 'unknown',
} as const;

export function SolverPanel({ pending, invalid, result, view, onView }: Props) {
  if (invalid)
    return (
      <section aria-label="Solver" className="solver">
        <h2>Solver</h2>
        <p>Fix the definition issues to analyze.</p>
      </section>
    );
  if (!result)
    return (
      <section aria-label="Solver" className="solver">
        <h2>Solver</h2>
        <p role="status">{pending ? 'Analyzing…' : 'No analysis yet.'}</p>
      </section>
    );
  if (!result.ok)
    return (
      <section aria-label="Solver" className="solver">
        <h2>Solver</h2>
        <pre className="error">{result.issues.join('\n')}</pre>
      </section>
    );
  const a = result.analysis;
  return (
    <section aria-label="Solver" className="solver">
      <h2>Solver</h2>
      <p role="status">
        <strong className={a.verdict.publishable ? 'badge ok' : 'badge no'}>
          {a.verdict.publishable ? 'publishable' : 'not publishable'}
        </strong>{' '}
        {a.verdict.reason}
      </p>
      <p>
        Solutions: {COUNT_LABEL[a.solutionCount]} ({a.nodes} search nodes)
      </p>
      {a.solutions.length > 0 && (
        <div className="toolbar">
          {a.solutions.map((_, i) => (
            <button
              // biome-ignore lint/suspicious/noArrayIndexKey: fixed small list
              key={i}
              type="button"
              aria-pressed={view.kind === 'solution' && view.which === i}
              onClick={() =>
                onView(
                  view.kind === 'solution' && view.which === i
                    ? { kind: 'none' }
                    : { kind: 'solution', which: i },
                )
              }
            >
              Show solution {i + 1}
            </button>
          ))}
          {a.differingCells.length > 0 && <span>{a.differingCells.length} differing cells highlighted</span>}
        </div>
      )}
      <h3>Difficulty</h3>
      <ul>
        <li>Deduction: {a.deduction}</li>
        <li>Minimum tier required: {a.requiredTier ?? 'not solvable by deduction'}</li>
        <li>
          Steps: {a.metrics.stepCount}; max tier {a.metrics.maxTier}; longest chain {a.metrics.longestChain}
        </li>
        <li>
          Strategies:{' '}
          {Object.entries(a.metrics.strategyCounts)
            .map(([k, n]) => `${k} x${n}`)
            .join(', ') || 'none'}
        </li>
      </ul>
      <h3>Deduction trace</h3>
      <ol className="trace">
        {a.trace.map((s) => (
          <li key={s.index}>
            <button
              type="button"
              aria-pressed={view.kind === 'step' && view.index === s.index}
              onClick={() =>
                onView(
                  view.kind === 'step' && view.index === s.index
                    ? { kind: 'none' }
                    : { kind: 'step', index: s.index },
                )
              }
            >
              [{s.strategy}, tier {s.tier}] {s.explanation}
            </button>
            <div className="elim">Eliminates {s.eliminations.join('; ')}</div>
          </li>
        ))}
      </ol>
    </section>
  );
}
