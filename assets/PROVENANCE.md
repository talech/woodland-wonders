# Asset provenance

All art currently shipped is **self-authored placeholder art**, dedicated to the public domain under
[CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/). No third-party, AI-generated or licensed assets are used.
Placeholders are replaceable: gameplay code refers only to `artKey`s from `@ww/puzzle-content` presentation config.

| artKey / asset | Source file | Description | Author | Licence | Added |
| --- | --- | --- | --- | --- | --- |
| `species/fox` | `packages/game-ui/src/art.tsx` | Triangular-eared fox face, white muzzle | Woodland Wonders project (lane C, M1) | CC0 1.0 | 2026-11-26 |
| `species/mouse` | `packages/game-ui/src/art.tsx` | Round mouse face, large round ears, whiskers | Woodland Wonders project (lane C, M1) | CC0 1.0 | 2026-11-26 |
| `species/rabbit` | `packages/game-ui/src/art.tsx` | Round rabbit face, two long upright ears | Woodland Wonders project (lane C, M1) | CC0 1.0 | 2026-11-26 |
| `habitat/tree` | `packages/game-ui/src/art.tsx` | Two-tier conifer with trunk | Woodland Wonders project (lane C, M1) | CC0 1.0 | 2026-11-26 |
| `habitat/mushroom` | `packages/game-ui/src/art.tsx` | Dome-capped spotted mushroom | Woodland Wonders project (lane C, M1) | CC0 1.0 | 2026-11-26 |
| `habitat/burrow` | `packages/game-ui/src/art.tsx` | Earth mound with dark entrance | Woodland Wonders project (lane C, M1) | CC0 1.0 | 2026-11-26 |
| (fallback) | `packages/game-ui/src/art.tsx` | Plain disc for unknown `artKey`s | Woodland Wonders project (lane C, M1) | CC0 1.0 | 2026-11-26 |
| UI icons (check, alert, sparkle, empty mark, undo, redo, back, hint) | `packages/game-ui/src/icons.tsx` | Simple geometric icons | Woodland Wonders project (lane C, M1) | CC0 1.0 | 2026-11-26 |

Notes:
- Every species and habitat has a distinct silhouette (ears/shape), and cells also render the content `glyph`, so
  identification never depends on colour alone (ADR-0009 P10, ADR-0008 P1).
- The app icon / splash images under `apps/game/assets/` are the Expo template defaults from the M0 scaffold and
  are outside this table; replace them before any public release.
