/**
 * The in-host entry point: VS Code loads this module inside the extension host
 * and awaits `run()`.
 *
 * The runner is mocha, and not the `node:test` the rest of this repository
 * uses, because `node:test` cannot report that it has finished inside an
 * extension host. Running it in process (`run({ isolation: 'none' })`, the only
 * mode whose test files can `require('vscode')`) reports every individual test
 * and then stops: the root test is finalised on `process.on('beforeExit')`, and
 * the host keeps handles alive for the life of the window, so the event loop
 * never drains, `test:summary` never arrives and the stream never ends. That is
 * not a VS Code quirk - a plain `node` script with one live `setInterval`
 * reproduces it exactly, and clearing the interval makes the summary appear.
 * Measured on VS Code 1.136.2 (Node 24.18.1). See test/README.md.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

import Mocha from 'mocha';
import * as vscode from 'vscode';

/** The compiled test files, in the order they must run (activation is one-way). */
const FILES = ['extension.test.js'];

/**
 * The order above is written out by hand, so it can go stale: a new
 * `suite/*.test.ts` would compile, be forced into test/README.md by the walk
 * in test/packaging.test.ts, and still never run. Fail loudly instead.
 */
function checkFiles(dir: string): void {
	const found = fs.readdirSync(dir).filter((f) => f.endsWith('.test.js')).sort();
	const listed = [...FILES].sort();
	if (found.join() !== listed.join()) {
		throw new Error('suite/index.ts FILES is [' + listed.join(', ')
			+ '] but the compiled suite holds [' + found.join(', ')
			+ ']; add the new file to FILES, in the position it must run in');
	}
}

/**
 * Per-test budget. Well above what these take (the whole suite is under a
 * second once the window is up) and above the 5 s activation wait inside it,
 * so a timeout here means something is genuinely stuck.
 */
const TIMEOUT_MS = 20_000;

export function run(): Promise<void> {
	// A failure stack here names the compiled JS, not the .ts. Node's
	// `process.setSourceMapsEnabled(true)` does not fix that in this host:
	// measured on 1.136.2, it sets `process.sourceMapsEnabled` to true and
	// changes nothing, because the extension host has already installed its own
	// `Error.prepareStackTrace`, which is what actually formats the stack. The
	// .js.map files are next to the .js, so an editor still resolves the line.
	console.log('[integration] VS Code ' + vscode.version
		+ ', Node ' + process.versions.node
		+ ', Electron ' + (process.versions.electron ?? 'n/a'));

	checkFiles(__dirname);
	// `forbidOnly` because a stray `it.only` would otherwise leave CI green
	// with one test run; node:test, which the other suite uses, needs
	// --test-only for that and so has never needed the guard.
	const mocha = new Mocha({
		ui: 'bdd', reporter: 'spec', timeout: TIMEOUT_MS, forbidOnly: true,
	});
	for (const file of FILES) { mocha.addFile(path.resolve(__dirname, file)); }

	return new Promise<void>((resolve, reject) => {
		try {
			mocha.run((failures) => {
				if (failures > 0) {
					reject(new Error(failures + ' integration test(s) failed'));
				} else {
					resolve();
				}
			});
		} catch (err) {
			reject(err instanceof Error ? err : new Error(String(err)));
		}
	});
}
