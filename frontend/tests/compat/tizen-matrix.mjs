/**
 * Samsung Tizen TV -> Chromium -> ECMAScript capability matrix.
 *
 * Samsung TVs do not ship a stand-alone browser version; the built-in browser
 * and every Tizen web app run on a Chromium fork frozen at the version that
 * shipped with that year's firmware. The TV never updates it, so a 2019 TV is
 * on Chromium 63 forever.
 *
 * Sources: Samsung "Web Engine Specifications" developer docs, per Tizen release.
 */
/**
 * `es` is the highest ECMAScript edition that Chromium version can *parse*.
 * It is a coarse proxy -- engines shipped a given edition's features over
 * several releases, so a version sitting on an edition boundary is rounded
 * down. The authority on what to emit is `browserslist` in package.json, which
 * Babel resolves per feature; this table is the backstop that catches a bundle
 * whose syntax has clearly out-run the oldest TV.
 *
 * Boundaries that matter here: object spread landed in Chromium 60, optional
 * catch binding in 66, optional chaining and nullish coalescing in 80, logical
 * assignment in 85, class fields in 94.
 */
export const TIZEN_TARGETS = [
    // Chromium 47 predates full ES2015 (destructuring and default parameters
    // only became complete in 49), so ES5 is the only safe floor for it.
    { tizen: '2.4', year: 2016, chromium: 47, es: 5 },
    { tizen: '3.0', year: 2017, chromium: 47, es: 5 },
    { tizen: '4.0', year: 2018, chromium: 56, es: 2017 },
    { tizen: '5.0', year: 2019, chromium: 63, es: 2018 },
    { tizen: '5.5', year: 2020, chromium: 69, es: 2019 },
    { tizen: '6.0', year: 2021, chromium: 76, es: 2019 },
    { tizen: '6.5', year: 2022, chromium: 85, es: 2021 },
    { tizen: '7.0', year: 2023, chromium: 94, es: 2022 },
    { tizen: '8.0', year: 2024, chromium: 108, es: 2022 },
];

/**
 * The oldest TV generation the app promises to support.
 * Lower this only together with the `browserslist` field in package.json --
 * the two must agree or the build will silently out-run the target again.
 */
export const OLDEST_SUPPORTED = '5.0';

export const target = (tizen = OLDEST_SUPPORTED) =>
    TIZEN_TARGETS.find(t => t.tizen === tizen);

/**
 * The TV browser reports a desktop-ish Chrome UA with a `Tizen <ver>` token and
 * a `SMART-TV` / `SamsungBrowser` marker. Real strings from Samsung's docs.
 */
export const userAgent = tizen => {
    const t = target(tizen);
    return `Mozilla/5.0 (SMART-TV; LINUX; Tizen ${t.tizen}) AppleWebKit/537.36 `
        + `(KHTML, like Gecko) ${samsungBrowserVersion(t)}/${t.chromium}.0.0.0 TV Safari/537.36`;
};

const samsungBrowserVersion = t => (t.chromium >= 63 ? 'SamsungBrowser/2.2 Chrome' : 'Chrome');
