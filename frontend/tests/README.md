# Browser compatibility tests

Two suites, because the Samsung TV problem has two halves and no single tool
covers both.

| Suite | Command | Answers |
| --- | --- | --- |
| Static compat gate | `npm run test:compat` | *Is the shipped bundle newer than the TV's engine can parse?* |
| Cross-browser E2E | `npm run test:browsers` | *Does the app boot, lay out and accept input in each browser?* |

Both need a production build first (`npm run build`) — the dev server transpiles
differently and hides exactly the failure we are hunting.

## Why a static gate at all

A Samsung TV runs a Chromium fork frozen at the firmware's release year, and it
never updates. When the bundle contains syntax that engine predates, the TV does
not log an error you can reach — it fails to *parse* the script and shows a blank
white page. You cannot install Chromium 69 to reproduce that, so
`tests/compat/bundle-syntax.mjs` parses the built bundle with acorn pinned to the
ECMAScript version that engine understood, and points at the first construct that
does not fit (resolved back through the source map to the module that emitted it).

```
npm run build && npm run test:compat        # against the supported floor
npm run test:compat -- 5.0                  # against 2019 TVs
```

The supported floor lives in `tests/compat/tizen-matrix.mjs` as `OLDEST_SUPPORTED`.
**It must agree with `browserslist.production` in `package.json`** — the matrix is
what the test asserts, browserslist is what Babel actually compiles to. If they
drift apart the build silently out-runs the target again.

The generation table (from Samsung's Web Engine Specifications):

| Tizen | TV model year | Chromium | Parses up to | Supported |
| --- | --- | --- | --- | --- |
| 3.0 | 2017 | 47 | ES5 | no |
| 4.0 | 2018 | 56 | ES2017 | no |
| 5.0 | 2019 | 63 | ES2018 | **yes — the floor** |
| 5.5 | 2020 | 69 | ES2019 | yes |
| 6.0 | 2021 | 76 | ES2019 | yes |
| 6.5 | 2022 | 85 | ES2021 | yes |
| 7.0 | 2023 | 94 | ES2022 | yes |
| 8.0 | 2024 | 108 | ES2022 | yes |

The "parses up to" column is deliberately coarse — engines shipped an edition's
features across several releases, so versions on a boundary are rounded down.
Babel's per-feature decisions come from `browserslist`, not from this table; the
table only has to be right enough to catch a bundle that has clearly out-run the
oldest TV. Getting it wrong in the conservative direction produces a false
failure, which is the safe way to be wrong.

## Cross-browser E2E

```
npm run test:browsers            # all projects
npm run test:tv                  # only the Samsung TV profiles
npx playwright test --project=safari
```

Projects: `chrome`, `firefox`, `safari`, `ipad`, `android`, and
`samsung-tv-2020` / `-2022` / `-2024`.

The TV projects run a **modern** engine with the TV's user agent, 1920×1080
viewport and input model (no touch, no hover). That catches UA sniffing, layout,
overscan and pointer-only interaction bugs — everything *except* engine age,
which is what the static gate is for. Neither suite alone is sufficient.

`tests/e2e/tv-remote.spec.js` is the TV-specific half: it checks every visible
control can be reached with a D-pad, reports text too small to read across a
room, and fails if the layout scrolls horizontally at 1080p.

### Running WebKit on Arch

Playwright's WebKit build links against `libicudata.so.74`, which Arch does not
carry (it ships a newer ICU). The `safari` and `ipad` projects therefore fail to
launch here with `error while loading shared libraries`. Either install `icu74`
from the AUR, or run those two projects in the Playwright container:

```
docker run --rm -v "$PWD":/w -w /w mcr.microsoft.com/playwright:v1.62.1-noble \
  npx playwright test --project=safari --project=ipad
```

Nothing about the app is broken when you see that error — it is the host missing
a library.
