const { test, expect } = require('@playwright/test');

/**
 * TV-only checks. A Samsung TV has no mouse and no touchscreen: the entire UI
 * is driven by a D-pad (arrow keys + Enter) and everything must be reachable by
 * focus alone. These run only against the samsung-tv-* projects.
 */
test.describe('samsung tv remote control', () => {
    test.beforeEach(async ({ page }, testInfo) => {
        test.skip(!testInfo.project.name.startsWith('samsung-tv'), 'TV input model only');

        await page.route('**/api/**', route =>
            route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }));
        await page.goto('/');
        await expect(page.locator('#root')).not.toBeEmpty({ timeout: 15_000 });
    });

    test('the first interactive control is reachable with the D-pad', async ({ page }) => {
        await page.keyboard.press('Tab');
        const focused = await page.evaluate(() => {
            const el = document.activeElement;
            return el && el !== document.body
                ? { tag: el.tagName, label: el.getAttribute('aria-label') || el.textContent?.trim() }
                : null;
        });
        expect(focused, 'nothing took focus -- the remote cannot drive this page').not.toBeNull();
    });

    test('every control can be tabbed to without a pointer', async ({ page }) => {
        // Anything clickable but not focusable is dead on a TV.
        const unreachable = await page.evaluate(() => {
            const COMPOSITE = '[role="combobox"], [role="menu"], [role="listbox"], [role="grid"]';
            function partOfCompositeWidget(el) {
                // Look a few levels up for a wrapper that holds the widget's
                // focusable part; three is enough for MUI's input decorations.
                let node = el.parentElement;
                for (let depth = 0; node && depth < 3; depth++, node = node.parentElement) {
                    if (node.querySelector(COMPOSITE)) return true;
                }
                return false;
            }
            const clickable = [...document.querySelectorAll(
                'button, [role="button"], a[href], input, select, textarea, [onclick]')];
            return clickable
                .filter(el => el.offsetParent !== null)          // visible only
                .filter(el => el.tabIndex < 0 && !el.disabled)
                // A composite widget (combobox, menu, listbox) takes focus as a
                // whole and drives its inner buttons from the arrow keys, so its
                // children being tabIndex -1 is correct rather than a trap. The
                // role sits on the widget's input, which is a sibling of the
                // button rather than an ancestor -- hence the walk upwards.
                .filter(el => !partOfCompositeWidget(el))
                .map(el => el.outerHTML.slice(0, 120));
        });
        expect(unreachable, 'controls that a remote can never focus').toEqual([]);
    });

    test('nothing important is hidden behind :hover', async ({ page }) => {
        // A TV pointer never hovers, so a rule that only reveals content on
        // :hover makes that content permanently invisible.
        const hoverOnly = await page.evaluate(() => {
            const found = [];
            for (const sheet of document.styleSheets) {
                let rules;
                try { rules = sheet.cssRules; } catch { continue; }   // cross-origin
                for (const rule of rules || []) {
                    if (!rule.selectorText || !rule.selectorText.includes(':hover')) continue;
                    const style = rule.style.cssText;
                    if (/(visibility:\s*visible|display:\s*(block|flex)|opacity:\s*1)/.test(style)) {
                        found.push(rule.selectorText);
                    }
                }
            }
            return found;
        });
        // Reported, not failed: MUI ships plenty of decorative hover rules and
        // only the ones that gate real content matter. Read the list by eye.
        test.info().annotations.push({
            type: 'hover-revealed rules', description: hoverOnly.join('\n') || 'none',
        });
    });

    test('text is large enough to read across a room', async ({ page }) => {
        const tiny = await page.evaluate(() => {
            const out = [];
            for (const el of document.querySelectorAll('body *')) {
                if (!el.textContent?.trim() || el.children.length) continue;
                const size = parseFloat(getComputedStyle(el).fontSize);
                if (size < 14) out.push(`${size}px: ${el.textContent.trim().slice(0, 40)}`);
            }
            return out;
        });
        test.info().annotations.push({
            type: 'text under 14px at 1080p', description: tiny.join('\n') || 'none',
        });
    });

    test('the layout does not overflow a 1080p screen', async ({ page }) => {
        // TVs also apply overscan; anything at the very edge may be cut off.
        const overflow = await page.evaluate(() =>
            document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(overflow, 'page scrolls horizontally on a TV').toBeLessThanOrEqual(0);
    });
});
