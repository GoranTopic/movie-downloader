const { test, expect } = require('@playwright/test');

/**
 * The "blank white page" test.
 *
 * When this app fails on a TV it does not show an error -- React never mounts
 * and you get an empty page. So the single most valuable assertion is: did
 * anything at all end up inside #root, and did the page throw on the way there?
 *
 * Every test here collects console errors and uncaught exceptions and attaches
 * them to the failure, because on a real TV you cannot open devtools.
 */

/** Fails the test on any uncaught exception, and returns the console error log. */
function watchForErrors(page) {
    const consoleErrors = [];
    const pageErrors = [];
    page.on('console', msg => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', err => pageErrors.push(err.message));
    return { consoleErrors, pageErrors };
}

/** Network calls to the backend are not what we are testing; stub them out. */
async function stubBackend(page) {
    await page.route('**/api/**', route =>
        route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }));
    await page.route('**/movies/**', route =>
        route.fulfill({ status: 200, contentType: 'application/json', body: '{"data":{"movies":[]}}' }));
}

test('the bundle parses and React mounts something into #root', async ({ page }) => {
    const { pageErrors } = watchForErrors(page);
    await stubBackend(page);

    await page.goto('/');

    // A SyntaxError from a too-new bundle shows up here and nowhere else.
    const syntaxErrors = pageErrors.filter(e => /SyntaxError|Unexpected token/i.test(e));
    expect(syntaxErrors, 'bundle failed to parse in this engine').toEqual([]);

    const root = page.locator('#root');
    await expect(root).toBeAttached();
    await expect
        .poll(() => root.innerHTML().then(html => html.length), { timeout: 15_000 })
        .toBeGreaterThan(0);

    expect(pageErrors, 'uncaught exception during boot').toEqual([]);
});

test('the main chrome of the app is visible', async ({ page }) => {
    await stubBackend(page);
    await page.goto('/');

    // The search box is the one control that is always present, logged in or not.
    await expect(page.getByRole('combobox').or(page.locator('input[type="text"]')).first())
        .toBeVisible({ timeout: 15_000 });
});

test('no missing-asset or mixed-content failures', async ({ page }) => {
    const failures = [];
    page.on('requestfailed', req => failures.push(`${req.failure()?.errorText} ${req.url()}`));
    page.on('response', res => {
        if (res.status() >= 400) failures.push(`HTTP ${res.status()} ${res.url()}`);
    });
    await stubBackend(page);

    await page.goto('/', { waitUntil: 'networkidle' });

    // A wrong PUBLIC_URL / homepage is the classic cause of a white page that
    // only reproduces in the deployed build, so 404s on static assets are fatal.
    const assetFailures = failures.filter(f => /static\/(js|css)/.test(f));
    expect(assetFailures, 'the JS/CSS bundle did not load').toEqual([]);
});
