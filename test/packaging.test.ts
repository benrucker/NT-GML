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
import { createHash } from 'node:crypto';

import { ROOT, read } from './helpers';

const exists = (rel: string) => fs.existsSync(path.join(ROOT, rel));

/** `package.json`, in the shape these tests read it. */
interface Manifest {
	version: string;
	license?: string;
	icon?: string;
	contributes?: {
		languages?: { id: string; configuration?: string }[];
		grammars?: { language: string; scopeName: string; path: string }[];
	};
}

const manifest = (): Manifest => JSON.parse(read(path.join(ROOT, 'package.json'))) as Manifest;

test('packaging: LICENSE exists and package.json declares MIT', () => {
	assert.ok(exists('LICENSE'), 'no LICENSE at the repository root');
	assert.match(read(path.join(ROOT, 'LICENSE')), /MIT License/);

	assert.equal(manifest().license, 'MIT');
});

/**
 * A Markdown file's prose, with fenced blocks and inline code spans removed,
 * so a path inside `...` or a shell snippet is not read as a link.
 *
 * This is a stripper, not a Markdown parser, and does not need to become one.
 * Forms it gets wrong, none of which these two files use today:
 *   - reference-style links (`[a][ref]`), links broken across a line, and
 *     angle-bracket targets `[a](<b>)` are simply not seen;
 *   - a fence indented 1-3 spaces, and a 4-space-indented code block, are
 *     scanned as prose, so a path in one would be a false positive;
 *   - a line with stray backticks on both sides of a link lets the span
 *     stripper swallow the link, so a broken link there goes unnoticed.
 */
const prose = (rel: string): string => read(path.join(ROOT, rel))
	.replace(/^```[\s\S]*?^```/gm, '')
	.replace(/`[^`\n]*`/g, '');

/** Relative link targets in `rel` that do not name a file in the repo. */
const brokenLinks = (rel: string): string[] => {
	const missing: string[] = [];
	for (const m of prose(rel).matchAll(/\]\((?!https?:|#)([^)]+)\)/g)) {
		// `[a](b "title")`: the target ends at the first whitespace. A `#frag`
		// suffix names a heading in the target file, so drop it.
		const target = decodeURIComponent(m[1].split(/\s/)[0].split('#')[0]);
		if (!exists(target)) { missing.push(rel + ' -> ' + target); }
	}
	return missing;
};

test('packaging: every relative link in README.md and CHANGELOG.md resolves', () => {
	assert.deepEqual([...brokenLinks('README.md'), ...brokenLinks('CHANGELOG.md')], []);
	// The cheat sheet moved to docs/ in section 5.5 and the README links it.
	assert.ok(exists('docs/NTT Modding Cheat Sheet.md'), 'cheat sheet is not in docs/');
});

test('packaging: CHANGELOG.md has a section for the version in package.json', () => {
	const version = manifest().version;
	const changelog = read(path.join(ROOT, 'CHANGELOG.md'));
	assert.ok(changelog.includes('## [' + version + ']'),
		'CHANGELOG.md has no "## [' + version + ']" heading');
});

test('packaging: README.md does not hard-code a .vsix version', () => {
	// `pnpm package` names the file after package.json's version, so a literal
	// `ntgml-0.1.0.vsix` in the README goes stale the moment the version moves.
	// A version that still matches is allowed; anything else is drift.
	const version = manifest().version;
	const stale = [...read(path.join(ROOT, 'README.md')).matchAll(/ntgml-\d+\.\d+\.\d+\.vsix/g)]
		.map((m) => m[0])
		.filter((name) => name !== 'ntgml-' + version + '.vsix');
	assert.deepEqual(stale, []);
});

test('packaging: .gitignore keeps build output and .vsix files out of the repo', () => {
	// Literal lines, like the .vscodeignore check below: enough to catch one
	// being dropped by hand.
	const lines = read(path.join(ROOT, '.gitignore')).split(/\r?\n/).map((l) => l.trim());
	for (const ignored of ['out/', '*.vsix']) {
		assert.ok(lines.indexOf(ignored) >= 0, '.gitignore lost the line ignoring ' + ignored);
	}
});

test('packaging: CI regenerates and diffs, and uploads a .vsix from both runners', () => {
	// Literal substrings, not a YAML parse: this catches the step being
	// deleted or the artifact name losing its per-OS suffix, which is all it
	// is here to do. The workflow itself is what actually runs on CI.
	const ci = read(path.join(ROOT, '.github/workflows/ci.yml'));
	assert.ok(ci.includes('pnpm gen'), 'CI no longer runs pnpm gen');
	assert.ok(ci.includes('git diff --exit-code'),
		'CI no longer fails on a stale committed table or grammar');
	assert.ok(ci.includes('name: vsix-${{ matrix.os }}'),
		'the .vsix artifact is not named per OS, so one runner overwrites the other');
	assert.ok(!/if:.*matrix\.os/.test(ci),
		'a step is conditional on matrix.os again; both runners should upload');
});

test('packaging: test/README.md names every test file', () => {
	const files = fs.readdirSync(path.join(ROOT, 'test'))
		.filter((f) => f.endsWith('.test.ts'))
		.sort();
	assert.ok(files.length > 0, 'no test files found');
	const readme = read(path.join(ROOT, 'test/README.md'));
	const undocumented = files.filter((f) => !readme.includes(f));
	assert.deepEqual(undocumented, [], 'test/README.md has no row for these');
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
	// `.claude/**` is not a source directory: agent worktrees can appear under
	// it, and vsce would otherwise sweep a whole second copy of the repo in.
	for (const dropped of ['api/**', 'src/**', 'tools/**', 'test/**', 'docs/**',
		'.claude/**', 'out/src/**', 'out/test/**', 'out/tools/**']) {
		assert.ok(lines.indexOf(dropped) >= 0, '.vscodeignore lost the line excluding ' + dropped);
	}
});

test('packaging: package.json ships an icon and it is a square PNG', () => {
	const icon = manifest().icon;
	assert.equal(typeof icon, 'string', 'package.json has no "icon"');
	assert.ok(exists(icon as string), 'no file at ' + icon);

	// Enough of the header to catch a truncated, renamed or re-encoded file.
	// The file is the game's own icon, extracted by tools/extract-icon.ps1.
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
 * The committed icon is Vlambeer's artwork extracted from nuclearthrone.exe
 * (LICENSE, "Nuclear Throne icon"), not something this repo draws, so there
 * is nothing to re-render it from: pin the bytes instead. A deliberate swap
 * updates the hash here; an accidental one (a re-save, a stray edit) fails.
 */
test('packaging: resources/icon.png is the pinned extraction from the game', () => {
	const png = fs.readFileSync(path.join(ROOT, manifest().icon as string));
	assert.equal(png.readUInt32BE(16), 256, 'width');
	assert.equal(png.readUInt32BE(20), 256, 'height');
	assert.equal(createHash('sha256').update(png).digest('hex'),
		'36e9c59ef2bfc7d72aabdb7efea1aab2d6bbfbb156303b1a5e6f8c09084961e2',
		'resources/icon.png changed; if that was deliberate, update this hash and LICENSE');
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
