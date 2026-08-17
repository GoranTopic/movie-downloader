#!/usr/bin/env node
/**
 * Static compatibility gate for the production bundle.
 *
 * Why this exists: you cannot install Chromium 69 to test against, and a TV that
 * is too old does not report a nice error -- it fails to *parse* the bundle and
 * renders a blank white page with nothing in any log you can reach. So instead
 * of running the old engine, we parse the shipped bundle with the ECMAScript
 * version that engine understood, and fail the build if it doesn't fit.
 *
 * Run: npm run test:compat        (after npm run build)
 *      npm run test:compat -- 6.5 (check against a different TV generation)
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as acorn from 'acorn';
import { TIZEN_TARGETS, OLDEST_SUPPORTED, target } from './tizen-matrix.mjs';

const BUILD_DIR = process.env.BUILD_PATH
    || join(fileURLToPath(new URL('../../', import.meta.url)), 'build');
const ES_LADDER = [5, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023];
const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

const wanted = process.argv[2] || OLDEST_SUPPORTED;
const tv = target(wanted);
if (!tv) {
    console.error(`Unknown Tizen version "${wanted}". Known: `
        + TIZEN_TARGETS.map(t => t.tizen).join(', '));
    process.exit(2);
}

const jsDir = join(BUILD_DIR, 'static', 'js');
if (!existsSync(jsDir)) {
    console.error(`No build found at ${BUILD_DIR}. Run \`npm run build\` first.`);
    process.exit(2);
}

console.log(`Target: Tizen ${tv.tizen} (${tv.year} TVs, Chromium ${tv.chromium}, `
    + `understands up to ES${tv.es})\n`);

let failed = false;

for (const file of readdirSync(jsDir).filter(f => f.endsWith('.js'))) {
    const source = readFileSync(join(jsDir, file), 'utf8');
    const lowest = ES_LADDER.find(v => parses(source, v));

    if (lowest === undefined) {
        failed = true;
        console.log(`  FAIL  ${file} -- does not parse at any known ES version`);
        continue;
    }
    if (lowest <= tv.es) {
        console.log(`  ok    ${file} (ES${lowest})`);
        continue;
    }

    failed = true;
    console.log(`  FAIL  ${file} needs ES${lowest}, the TV only understands ES${tv.es}`);
    console.log(`        This bundle throws SyntaxError on the TV -> blank white page.`);
    report(source, tv.es, join(jsDir, file));
}

if (failed) {
    console.log(`\nThe production bundle is newer than Tizen ${tv.tizen} can parse.`);
    console.log(`Fix by widening \`browserslist.production\` in package.json to include`);
    console.log(`the TV (e.g. "chrome >= ${tv.chromium}") so Babel transpiles down to it.`);
    process.exit(1);
}
console.log(`\nAll bundles parse on Tizen ${tv.tizen} and newer.`);

function parses(source, ecmaVersion) {
    try {
        acorn.parse(source, { ecmaVersion, sourceType: 'script' });
        return true;
    } catch {
        try {
            acorn.parse(source, { ecmaVersion, sourceType: 'module' });
            return true;
        } catch {
            return false;
        }
    }
}

/** Point at the exact construct the old engine chokes on, and blame a module. */
function report(source, ecmaVersion, filePath) {
    let err;
    try {
        acorn.parse(source, { ecmaVersion, locations: true });
        return;
    } catch (e) {
        err = e;
    }
    const { line, column } = err.loc || {};
    console.log(`        First offending construct: ${err.message}`);
    if (line !== undefined) {
        const text = source.split('\n')[line - 1] || '';
        const from = Math.max(0, column - 60);
        console.log(`        ...${text.slice(from, column + 60).trim()}...`);
        const origin = blame(filePath, line, column);
        if (origin) console.log(`        Comes from: ${origin}`);
    }
}

/** Resolve a bundle position back to its source module via the .map, if built with one. */
function blame(filePath, line, column) {
    const mapPath = `${filePath}.map`;
    if (!existsSync(mapPath)) {
        return 'unknown (rebuild with GENERATE_SOURCEMAP=true to name the culprit)';
    }
    const map = JSON.parse(readFileSync(mapPath, 'utf8'));
    const lines = (map.mappings || '').split(';');
    if (lines.length < line) return null;

    // Source index and source line are deltas accumulated across the *whole*
    // mappings string, so every earlier line has to be walked to get here.
    // Only the generated column resets per line.
    let srcIdx = 0, srcLine = 0, best = null;
    for (let i = 0; i < line; i++) {
        let genCol = 0;
        for (const seg of lines[i].split(',')) {
            if (!seg) continue;
            const [dGenCol, dSrcIdx, dSrcLine] = decodeVlq(seg);
            genCol += dGenCol;
            if (dSrcIdx === undefined) continue;
            srcIdx += dSrcIdx;
            srcLine += dSrcLine;
            // Only positions on the offending line can be the culprit.
            if (i === line - 1 && genCol <= column) {
                best = { source: map.sources[srcIdx], line: srcLine + 1 };
            }
        }
    }
    return best ? `${best.source}:${best.line}` : null;
}

function decodeVlq(segment) {
    const values = [];
    let shift = 0, value = 0;
    for (const char of segment) {
        const digit = B64.indexOf(char);
        const hasContinuation = digit & 32;
        value += (digit & 31) << shift;
        if (hasContinuation) {
            shift += 5;
        } else {
            const negative = value & 1;
            value >>= 1;
            values.push(negative ? -value : value);
            shift = 0;
            value = 0;
        }
    }
    return values;
}
