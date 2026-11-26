/**
 * check:boundaries — enforces ADR-0004 package boundaries statically.
 *
 * Rules:
 *  1. Workspace imports (`@ww/*`) must target an allowed dependency per the direction graph below.
 *  2. They must be declared in the importing package's package.json.
 *  3. Only subpaths listed in the target's `exports` may be imported (no deep/private imports).
 *  4. No relative import may escape its package root.
 *  5. Shipped game code (apps/game, packages/game-ui; non-test files) must not import exhaustive search,
 *     the generator or test fixtures.
 *
 * Run: node scripts/check-boundaries.ts
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');

/** Allowed runtime dependency direction (ADR-0004). Keys are package names, values the workspace deps allowed. */
const ALLOWED: Record<string, readonly string[]> = {
  '@ww/puzzle-core': [],
  '@ww/puzzle-solver': ['@ww/puzzle-core'],
  '@ww/puzzle-generator': ['@ww/puzzle-core', '@ww/puzzle-solver'],
  '@ww/puzzle-content': ['@ww/puzzle-core', '@ww/puzzle-solver'], // solver: validation script/tests only (devDependency)
  '@ww/game-ui': ['@ww/puzzle-core'],
  '@ww/game': ['@ww/puzzle-core', '@ww/puzzle-solver', '@ww/puzzle-content', '@ww/game-ui'],
  '@ww/puzzle-editor': ['@ww/puzzle-core', '@ww/puzzle-solver', '@ww/puzzle-generator', '@ww/puzzle-content'],
};

/** Imports forbidden in shipped game code (tests excepted). */
const GAME_FORBIDDEN = [
  /^@ww\/puzzle-generator(\/|$)/,
  /^@ww\/puzzle-solver\/search(\/|$)/,
  /^@ww\/[^/]+\/testing(\/|$)/,
];
const GAME_PACKAGES = new Set(['@ww/game', '@ww/game-ui']);

/** Workspace packages may only import from these (dev-only) when inside test or script files. */
const DEV_ONLY_OK_IN: RegExp = /(^|\/)(test|scripts)\/|\.test\.tsx?$|vitest\.config\.ts$/;

interface Pkg {
  name: string;
  dir: string;
  deps: Set<string>;
  devDeps: Set<string>;
  exports: Set<string>;
}

function readPackages(): Map<string, Pkg> {
  const pkgs = new Map<string, Pkg>();
  for (const group of ['apps', 'packages']) {
    for (const entry of readdirSync(join(ROOT, group))) {
      const dir = join(ROOT, group, entry);
      let json: {
        name: string;
        dependencies?: Record<string, string>;
        devDependencies?: Record<string, string>;
        peerDependencies?: Record<string, string>;
        exports?: Record<string, string> | string;
      };
      try {
        json = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'));
      } catch {
        continue;
      }
      const exp = json.exports;
      const exportsSet = new Set<string>(typeof exp === 'string' ? ['.'] : exp ? Object.keys(exp) : ['.']);
      pkgs.set(json.name, {
        name: json.name,
        dir,
        deps: new Set([...Object.keys(json.dependencies ?? {}), ...Object.keys(json.peerDependencies ?? {})]),
        devDeps: new Set(Object.keys(json.devDependencies ?? {})),
        exports: exportsSet,
      });
    }
  }
  return pkgs;
}

function* sourceFiles(dir: string): Generator<string> {
  for (const entry of readdirSync(dir)) {
    if (['node_modules', 'dist', '.expo', 'web-build', 'coverage'].includes(entry)) continue;
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) yield* sourceFiles(p);
    else if (/\.(ts|tsx|mts|js|jsx|mjs)$/.test(entry) && !entry.endsWith('.d.ts')) yield p;
  }
}

const IMPORT_RE =
  /(?:import|export)\s[^'"]*?from\s*['"]([^'"]+)['"]|import\s*\(\s*['"]([^'"]+)['"]\s*\)|require\(\s*['"]([^'"]+)['"]\s*\)|import\s+['"]([^'"]+)['"]/g;

const errors: string[] = [];
const pkgs = readPackages();

for (const pkg of pkgs.values()) {
  const allowed = ALLOWED[pkg.name];
  if (!allowed) {
    errors.push(`${pkg.name}: not registered in check-boundaries ALLOWED graph`);
    continue;
  }
  for (const file of sourceFiles(pkg.dir)) {
    const rel = relative(pkg.dir, file);
    const isDevFile = DEV_ONLY_OK_IN.test(rel);
    const text = readFileSync(file, 'utf8');
    for (const m of text.matchAll(IMPORT_RE)) {
      const spec = m[1] ?? m[2] ?? m[3] ?? m[4];
      if (!spec) continue;
      const where = `${relative(ROOT, file)}: '${spec}'`;

      if (spec.startsWith('.')) {
        const target = resolve(dirname(file), spec);
        if (!target.startsWith(`${pkg.dir}/`) && target !== pkg.dir)
          errors.push(`${where} escapes package root`);
        continue;
      }
      if (!spec.startsWith('@ww/')) continue;

      const [scope, name, ...rest] = spec.split('/');
      const target = `${scope}/${name}`;
      const subpath = rest.length ? `./${rest.join('/')}` : '.';
      const targetPkg = pkgs.get(target);
      if (!targetPkg) {
        errors.push(`${where} unknown workspace package`);
        continue;
      }
      if (!allowed.includes(target))
        errors.push(`${where} violates dependency direction (${pkg.name} → ${target})`);
      const declared = pkg.deps.has(target) || (isDevFile && pkg.devDeps.has(target));
      if (!declared)
        errors.push(
          `${where} not declared in ${pkg.name} ${isDevFile ? 'dependencies/devDependencies' : 'dependencies'}`,
        );
      if (!targetPkg.exports.has(subpath)) errors.push(`${where} is not a public export of ${target}`);
      if (GAME_PACKAGES.has(pkg.name) && !isDevFile && GAME_FORBIDDEN.some((re) => re.test(spec)))
        errors.push(`${where} is forbidden in the gameplay bundle (ADR-0004)`);
    }
  }
}

if (errors.length > 0) {
  console.error(`check:boundaries — ${errors.length} violation(s):`);
  for (const e of errors) console.error(`  ✗ ${e}`);
  process.exit(1);
}
console.log(`check:boundaries — ok (${pkgs.size} packages)`);
