/**
 * Packaging and licensing invariants (NTGML-PORT-SCOPE.md section 5.5).
 *
 * Cheap file-level checks, not a substitute for running `pnpm package`: they
 * catch the files that vsce warns about, or that the README links to, going
 * missing. CI runs `pnpm package` for the real thing.
 */

import * as assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { test } from 'node:test';
import * as zlib from 'node:zlib';

import { buildScene, render } from '../tools/render-icon';
import { ROOT, read } from './helpers';

const exists = (rel: string) => fs.existsSync(path.join(ROOT, rel));

test('packaging: LICENSE exists and package.json declares MIT', () => {
	assert.ok(exists('LICENSE'), 'no LICENSE at the repository root');
	assert.match(read(path.join(ROOT, 'LICENSE')), /MIT License/);

	const pkg = JSON.parse(read(path.join(ROOT, 'package.json'))) as { license?: string };
	assert.equal(pkg.license, 'MIT');
});

test('packaging: every relative link in README.md resolves', () => {
	// Prose links only: fenced blocks and inline code spans are stripped first,
	// so a path inside `...` or a shell snippet is not treated as a link.
	// This is a stripper, not a Markdown parser, and does not need to become
	// one. Forms it gets wrong, none of which the README uses today:
	//   - reference-style links (`[a][ref]`), links broken across a line, and
	//     angle-bracket targets `[a](<b>)` are simply not seen;
	//   - a fence indented 1-3 spaces, and a 4-space-indented code block, are
	//     scanned as prose, so a path in one would be a false positive;
	//   - a line with stray backticks on both sides of a link lets the span
	//     stripper swallow the link, so a broken link there goes unnoticed.
	const readme = read(path.join(ROOT, 'README.md'))
		.replace(/^```[\s\S]*?^```/gm, '')
		.replace(/`[^`\n]*`/g, '');

	const missing: string[] = [];
	for (const m of readme.matchAll(/\]\((?!https?:|#)([^)]+)\)/g)) {
		// `[a](b "title")`: the target ends at the first whitespace. A `#frag`
		// suffix names a heading in the target file, so drop it.
		const target = decodeURIComponent(m[1].split(/\s/)[0].split('#')[0]);
		if (!exists(target)) { missing.push(target); }
	}
	assert.deepEqual(missing, []);
	// The cheat sheet moved to docs/ in section 5.5 and the README links it.
	assert.ok(exists('docs/NTT Modding Cheat Sheet.md'), 'cheat sheet is not in docs/');
});

test('packaging: .vscodeignore has no line excluding a file the .vsix needs', () => {
	// Literal line matching, not ignore-pattern semantics: this catches a line
	// being added or dropped by hand. `pnpm package` in CI is the real check.
	const lines = read(path.join(ROOT, '.vscodeignore')).split(/\r?\n/).map((l) => l.trim());
	// `resources/` holds the icon, the one packaged file outside syntaxes/ and
	// data/: excluding it leaves the manifest pointing at nothing.
	for (const kept of ['LICENSE', 'README.md', 'CHANGELOG.md', 'package.json',
		'syntaxes/**', 'data/**', 'out/**',
		'resources/**', 'resources/icon.png', 'resources/']) {
		assert.ok(lines.indexOf(kept) < 0, '.vscodeignore has a line excluding ' + kept);
	}
	for (const dropped of ['api/**', 'src/**', 'tools/**', 'test/**', 'docs/**',
		'out/src/**', 'out/test/**', 'out/tools/**']) {
		assert.ok(lines.indexOf(dropped) >= 0, '.vscodeignore lost the line excluding ' + dropped);
	}
});

interface Manifest {
	icon?: string;
	contributes?: {
		languages?: { id: string; configuration?: string }[];
		grammars?: { language: string; scopeName: string; path: string }[];
	};
}

const manifest = (): Manifest => JSON.parse(read(path.join(ROOT, 'package.json'))) as Manifest;

test('packaging: package.json ships an icon and it is a square PNG', () => {
	const icon = manifest().icon;
	assert.equal(typeof icon, 'string', 'package.json has no "icon"');
	assert.ok(exists(icon as string), 'no file at ' + icon);

	// Enough of the header to catch a truncated, renamed or re-encoded file.
	// tools/render-icon.ts writes exactly this shape; regenerate with
	// `pnpm gen:icon` (it is deliberately not part of `pnpm gen`).
	const png = fs.readFileSync(path.join(ROOT, icon as string));
	assert.deepEqual([...png.subarray(0, 8)], [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
		'not a PNG');
	assert.equal(png.readUInt32BE(8), 13, 'first chunk is not a 13-byte header');
	assert.equal(png.subarray(12, 16).toString('latin1'), 'IHDR', 'first chunk is not IHDR');

	const width = png.readUInt32BE(16);
	const height = png.readUInt32BE(20);
	assert.equal(width, height, 'the icon must be square');
	assert.ok(width >= 128, 'the Marketplace wants at least 128x128, got ' + width);
	assert.equal(png[24], 8, 'bit depth');
	assert.equal(png[25], 6, 'colour type: 8-bit RGBA');
});

/**
 * The artwork, not the file. `tools/render-icon.ts` is deliberately outside
 * `pnpm gen` and nothing byte-compares its output, because the DEFLATE stream
 * is zlib's and zlib has changed its output between Node releases: a byte
 * compare would fail on the compressor without the picture having changed.
 * Inflating the IDAT and comparing decoded pixels is what sidesteps that.
 *
 * The +/-2 is for per-channel rounding, and for nothing else. It is not
 * headroom for the renderer to drift: a `Math.cos`/`sin`/`atan2`/`hypot`
 * last-bit difference between V8 builds only changes a pixel if it moves a
 * sample point across a boundary it was already within about 1e-14 of - the
 * spacing of doubles at the coordinates the shapes use - and at SAMPLES=4 one
 * flipped sample moves that pixel by at least about 8 levels in some channel
 * (8.4 at a brace edge, 12 at a trefoil edge, about 16 on the tile's outer
 * edge, where the alpha itself steps). So it would fail here - correctly,
 * since the drawn picture would have changed. Today the worst difference is 0.
 */
test('packaging: resources/icon.png is what tools/render-icon.ts draws', () => {
	const png = fs.readFileSync(path.join(ROOT, manifest().icon as string));
	const width = png.readUInt32BE(16);
	const height = png.readUInt32BE(20);

	// Walk the chunks rather than assuming a layout, and concatenate every
	// IDAT: the spec allows an image to be split across several of them.
	const idat: Buffer[] = [];
	for (let at = 8; at + 12 <= png.length;) {
		const length = png.readUInt32BE(at);
		const type = png.subarray(at + 4, at + 8).toString('latin1');
		if (type === 'IDAT') { idat.push(png.subarray(at + 8, at + 8 + length)); }
		if (type === 'IEND') { break; }
		at += 12 + length;
	}
	assert.ok(idat.length > 0, 'no IDAT chunk');

	const stride = width * 4;
	const raw = zlib.inflateSync(Buffer.concat(idat));
	assert.equal(raw.length, height * (stride + 1), 'unexpected raw size');

	const fresh = render(buildScene());
	assert.equal(fresh.length, height * stride, 'render() and the PNG disagree on size');

	let worst = 0;
	let where = '';
	for (let y = 0; y < height; y++) {
		assert.equal(raw[y * (stride + 1)], 0, 'scanline ' + y + ' is not filter type 0');
		for (let x = 0; x < stride; x++) {
			const diff = Math.abs(raw[y * (stride + 1) + 1 + x] - fresh[y * stride + x]);
			if (diff > worst) { worst = diff; where = 'at ' + (x >> 2) + ',' + y; }
		}
	}
	assert.ok(worst <= 2,
		'committed icon differs from a fresh render by ' + worst + ' ' + where +
		'; rerun `pnpm gen:icon` and look at the result');
});

test('packaging: every contributed configuration and grammar file exists and parses', () => {
	const contributes = manifest().contributes ?? {};
	const problems: string[] = [];
	// Present is not enough: VS Code reads both of these as JSON, so a file that
	// exists but does not parse is a silently dead contribution. Language
	// configurations may be JSONC in VS Code, but ours are plain JSON on
	// purpose, so JSON.parse is the right check for both kinds of file.
	const parses = (rel: string, what: string): void => {
		if (!exists(rel)) { problems.push(what + ' is missing: ' + rel); return; }
		try { JSON.parse(read(path.join(ROOT, rel))); }
		catch (e) { problems.push(what + ' is not valid JSON: ' + rel + ': ' + String(e)); }
	};
	for (const language of contributes.languages ?? []) {
		if (language.configuration !== undefined) {
			parses(language.configuration, language.id + ' configuration');
		}
	}
	for (const grammar of contributes.grammars ?? []) {
		parses(grammar.path, grammar.scopeName + ' grammar');
	}
	assert.deepEqual(problems, []);

	// Every grammar names a language that is actually contributed, and the
	// other way round: a language with no grammar gets no highlighting.
	const ids = (contributes.languages ?? []).map((l) => l.id).sort();
	const languagesWithGrammar = (contributes.grammars ?? []).map((g) => g.language).sort();
	assert.deepEqual(languagesWithGrammar, ids);
});
