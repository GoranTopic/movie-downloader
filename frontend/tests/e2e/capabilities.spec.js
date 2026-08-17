const { test, expect } = require('@playwright/test');

/**
 * Capability probes, run once per browser project.
 *
 * These do not exercise the app -- they ask each engine what it supports, so
 * that when the TV misbehaves you can tell "the app is broken" apart from
 * "this engine cannot do that". Results are attached to the report; only the
 * genuinely required capabilities are asserted.
 */

/** Everything the app will call at runtime, and what it needs it for. */
const REQUIRED = {
    'WebSocket': 'live torrent status and watch-together sync',
    'Promise': 'every network call',
    'fetch': 'axios transport',
    'localStorage': 'the stored login session',
    'MutationObserver': 'React / MUI internals',
    'CSS.supports': 'MUI style injection',
    'URLSearchParams': 'parsing the share link',
};

test('required web APIs are present', async ({ page }) => {
    await page.goto('/');
    const missing = await page.evaluate(names => names.filter(n => {
        const path = n.split('.');
        let cursor = window;
        for (const part of path) {
            if (cursor == null || !(part in cursor)) return true;
            cursor = cursor[part];
        }
        return false;
    }), Object.keys(REQUIRED));

    expect(missing.map(n => `${n} (needed for ${REQUIRED[n]})`)).toEqual([]);
});

test('the engine can play the media the app serves', async ({ page, browserName }) => {
    await page.goto('/');
    const support = await page.evaluate(() => {
        const video = document.createElement('video');
        const probe = type => video.canPlayType(type) || 'no';
        return {
            // What the player actually requests today (MediaPlayerModal.js).
            'mp4 (H.264 baseline)': probe('video/mp4; codecs="avc1.42E01E, mp4a.40.2"'),
            'mp4 (H.264 high)': probe('video/mp4; codecs="avc1.64001E, mp4a.40.2"'),
            'mp4 (H.265/HEVC)': probe('video/mp4; codecs="hev1.1.6.L93.B0"'),
            'mkv (Matroska)': probe('video/x-matroska'),
            'webm (VP9)': probe('video/webm; codecs="vp9"'),
            'AC-3 audio': probe('audio/mp4; codecs="ac-3"'),
            'MediaSource': typeof window.MediaSource !== 'undefined',
            'WebVTT subtitles': typeof window.VTTCue !== 'undefined',
        };
    });

    // Caveat for the samsung-tv-* projects: these answers come from the local
    // Chromium, not from a TV. Real Samsung panels decode HEVC and AC-3 in
    // hardware and will say yes where this says no. Trust this list for
    // "the app asked for something no browser plays", not as a TV codec table.
    test.info().annotations.push({
        type: 'media support',
        description: Object.entries(support).map(([k, v]) => `${k}: ${v}`).join('\n'),
    });

    expect(support['WebVTT subtitles'], 'subtitles will not render').toBe(true);

    // A torrent is usually an H.264 mp4; if that will not play, nothing will.
    // Asserted on Chromium only: Playwright's Firefox and WebKit builds ship
    // without the proprietary decoders that the same browsers have on a real
    // desktop, so a "no" from them says nothing about the app. The TV is
    // Chromium anyway, which is the engine this project cares about.
    test.skip(browserName !== 'chromium', 'codec support is not representative here');
    expect(support['mp4 (H.264 high)'], 'cannot play H.264 mp4').not.toBe('no');
});

test('modern JS features the bundle relies on', async ({ page }) => {
    await page.goto('/');
    // A quick sanity probe of the syntax level the *engine* accepts. On a real
    // old TV these throw; here they document what the emulated project cannot
    // prove. The authoritative check is `npm run test:compat`.
    const level = await page.evaluate(() => {
        const accepts = src => { try { new Function(src); return true; } catch { return false; } };
        return {
            'arrow functions (ES2015)': accepts('()=>1'),
            'async/await (ES2017)': accepts('async()=>{await 1}'),
            'object spread (ES2018)': accepts('({...{}})'),
            'optional catch (ES2019)': accepts('try{}catch{}'),
            'optional chaining (ES2020)': accepts('({})?.a'),
            'nullish coalescing (ES2020)': accepts('null ?? 1'),
            'logical assignment (ES2021)': accepts('let a; a ??= 1'),
            'class fields (ES2022)': accepts('class A{ x = 1 }'),
        };
    });
    test.info().annotations.push({
        type: 'engine syntax support',
        description: Object.entries(level).map(([k, v]) => `${k}: ${v}`).join('\n'),
    });
});
