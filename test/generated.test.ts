/**
 * The committed `src/generated/*` must be exactly what the generator produces
 * from the vendored dump plus the reference, overrides and docs in `api/`.
 *
 * This is the main golden: it fails when the parser, the generator, the
 * overrides or the vendored inputs change without `pnpm gen` being rerun,
 * and it fails when generation stops being deterministic.
 */

import * as assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { test } from 'node:test';

import { GENERATED_DIR, ROOT, lf, read } from './helpers';

const GENERATOR = path.join(ROOT, 'out', 'tools', 'generate-api.js');

function runGenerator(outDir: string): string {
	return execFileSync(process.execPath, [GENERATOR, '--vendored', '--out', outDir], {
		cwd: ROOT,
		encoding: 'utf8',
		stdio: ['ignore', 'pipe', 'pipe'],
	});
}

test('generator: committed src/generated matches a fresh run on the vendored dump', () => {
	assert.ok(fs.existsSync(GENERATOR), 'build the generator first: tsc -p tools');
	const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ntgml-gen-'));
	try {
		const summary = runGenerator(tmp);
		assert.match(summary, /self-checks:\s+ok/);

		const fresh = fs.readdirSync(tmp).sort();
		const committed = fs.readdirSync(GENERATED_DIR).sort();
		assert.deepEqual(fresh, committed, 'set of generated files differs');

		for (const name of fresh) {
			assert.equal(
				lf(read(path.join(GENERATED_DIR, name))),
				lf(read(path.join(tmp, name))),
				'src/generated/' + name + ' is stale: run `pnpm gen` and commit the result');
		}
	} finally {
		fs.rmSync(tmp, { recursive: true, force: true });
	}
});
