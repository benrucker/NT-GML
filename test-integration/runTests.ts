/**
 * Host launcher for the integration suite (see test/README.md).
 *
 * Downloads the pinned VS Code build into `.vscode-test/`, creates a throwaway
 * workspace under the OS temp directory, copies `fixtures/` into it and starts
 * the editor with this repository as the extension under development. The
 * in-host entry point is `suite/index.js`.
 *
 * Nothing here touches the developer's real VS Code profile: the launch gets
 * its own `--user-data-dir` inside the same temp directory.
 */

import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { downloadAndUnzipVSCode, runTests } from '@vscode/test-electron';

/** Repository root (this file compiles to out/test-integration/test-integration/). */
const ROOT = path.resolve(__dirname, '..', '..', '..');

/**
 * The one place the VS Code version is written. `.github/workflows/ci.yml`
 * repeats it in its cache key and `test/packaging.test.ts` fails if the two
 * ever disagree, so there is still only one number to change.
 */
export const VSCODE_VERSION = fs
	.readFileSync(path.join(ROOT, 'test-integration', 'vscode-version.txt'), 'utf8')
	.trim();

/** Directory name prefix for a run's throwaway workspace and user data. */
const TEMP_PREFIX = 'ntgml-integration-';

/** How old a leftover has to be before the sweep will touch it. */
const STALE_MS = 60 * 60 * 1000;

/**
 * Remove workspaces left behind by runs that were killed before their
 * `finally` could fire.
 *
 * Only directories whose mtime is more than an hour old. A younger one may
 * belong to another `pnpm test:integration` running on this machine right now,
 * and deleting its workspace or user data underneath it would break that run -
 * on POSIX `rmSync` unlinks files that are still open without complaint, so
 * being in use is no protection.
 *
 * Best effort throughout: a temp directory that cannot be listed, and an entry
 * that cannot be removed, are both skipped rather than failing the run.
 */
function sweepStaleTempDirs(): void {
	let entries: string[];
	try {
		entries = fs.readdirSync(os.tmpdir());
	} catch (err) {
		console.warn('could not list ' + os.tmpdir() + ': ' + String(err));
		return;
	}
	const cutoff = Date.now() - STALE_MS;
	for (const name of entries) {
		if (!name.startsWith(TEMP_PREFIX)) { continue; }
		const dir = path.join(os.tmpdir(), name);
		try {
			if (fs.statSync(dir).mtimeMs > cutoff) { continue; }
			fs.rmSync(dir, { recursive: true, force: true });
		} catch { /* gone already, or not ours to remove */ }
	}
}

async function main(): Promise<void> {
	sweepStaleTempDirs();
	const cachePath = path.join(ROOT, '.vscode-test');
	const vscodeExecutablePath = await downloadAndUnzipVSCode({
		version: VSCODE_VERSION,
		cachePath,
	});

	// A fresh workspace per run: the tests open documents and edit them in
	// memory, and a leftover editor layout would change what is open at start.
	const temp = fs.mkdtempSync(path.join(os.tmpdir(), TEMP_PREFIX));
	const workspace = path.join(temp, 'workspace');
	fs.cpSync(path.join(ROOT, 'test-integration', 'fixtures'), workspace, { recursive: true });

	try {
		await runTests({
			vscodeExecutablePath,
			extensionDevelopmentPath: ROOT,
			extensionTestsPath: path.resolve(__dirname, 'suite', 'index.js'),
			launchArgs: [
				workspace,
				'--disable-extensions',
				'--disable-workspace-trust',
				'--user-data-dir', path.join(temp, 'user-data'),
			],
		});
	} finally {
		// Windows can still hold the user-data directory open for a moment
		// after the window closes. A failure to tidy up must not turn a passing
		// run red; the sweep above catches whatever is left behind.
		try { fs.rmSync(temp, { recursive: true, force: true }); }
		catch (err) { console.warn('could not remove ' + temp + ': ' + String(err)); }
	}
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
