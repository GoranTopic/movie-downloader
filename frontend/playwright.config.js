// @ts-check
const { defineConfig, devices } = require('@playwright/test');
const { userAgent } = require('./tests/compat/tizen-matrix.mjs');

/**
 * A note on what the "Samsung TV" projects can and cannot prove.
 *
 * Playwright cannot run Chromium 69, so these projects run the modern engine
 * with the TV's user agent, screen size and input model (no touch, no hover,
 * remote control only). That catches layout, UA-sniffing and pointer-only
 * interaction bugs -- everything except "the engine is too old for this code".
 *
 * The engine-age half of the problem is covered statically instead, by
 * `npm run test:compat`, which parses the bundle at the TV's ES level.
 * Run both; neither alone is enough.
 */
const PORT = 4173;

/** A TV is 1080p, sits at a distance, and is driven entirely by a D-pad. */
const tvProfile = tizen => ({
    ...devices['Desktop Chrome'],
    userAgent: userAgent(tizen),
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
    hasTouch: false,
    isMobile: false,
    // TVs are weak; heavy animation is where they stutter or drop frames.
    reducedMotion: 'reduce',
});

module.exports = defineConfig({
    testDir: './tests/e2e',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 1 : 0,
    reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',

    use: {
        baseURL: `http://localhost:${PORT}`,
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
    },

    projects: [
        { name: 'chrome', use: { ...devices['Desktop Chrome'] } },
        { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
        // WebKit stands in for Safari / iPad, which is the other browser this
        // app has had trouble with.
        { name: 'safari', use: { ...devices['Desktop Safari'] } },
        { name: 'ipad', use: { ...devices['iPad (gen 7)'] } },
        { name: 'android', use: { ...devices['Pixel 7'] } },

        { name: 'samsung-tv-2020', use: tvProfile('5.5') },
        { name: 'samsung-tv-2022', use: tvProfile('6.5') },
        { name: 'samsung-tv-2024', use: tvProfile('8.0') },
    ],

    // Serves the *production* build, because that is what the TV loads --
    // the dev server output is transpiled differently and hides the problem.
    webServer: {
        command: `npx serve -s ${process.env.BUILD_PATH || 'build'} -l ${PORT}`,
        url: `http://localhost:${PORT}`,
        reuseExistingServer: !process.env.CI,
        timeout: 60_000,
    },
});
