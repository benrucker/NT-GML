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
	for (const kept of ['LICENSE', 'README.md', 'CHANGELOG.md', 'package.json',
		'syntaxes/**', 'data/**', 'out/**']) {
		assert.ok(lines.indexOf(kept) < 0, '.vscodeignore has a line excluding ' + kept);
	}
	for (const dropped of ['api/**', 'src/**', 'tools/**', 'test/**', 'docs/**',
		'out/src/**', 'out/test/**', 'out/tools/**']) {
		assert.ok(lines.indexOf(dropped) >= 0, '.vscodeignore lost the line excluding ' + dropped);
	}
});
