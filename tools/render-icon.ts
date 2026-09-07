/**
 * Renders `resources/icon.png`, the extension's Marketplace / Extensions-view
 * icon.
 *
 *   pnpm gen:icon                            # compiles tools/, then runs this
 *   node out/tools/render-icon.js [--out <file>]
 *
 * Deliberately NOT part of `pnpm gen`, and no test byte-compares a fresh
 * render with the committed PNG. The pixels are fully deterministic, but the
 * DEFLATE stream they are packed into is zlib's, and zlib's exact output has
 * changed between Node releases before, so a byte compare in CI would fail on
 * the compressor rather than on the artwork. `test/packaging.test.ts` guards
 * the artwork instead: it inflates the committed IDAT and compares the decoded
 * pixels with a fresh `render()`. Decoding is what sidesteps zlib; its +/-2
 * per-channel tolerance is for rounding only, and is not a licence for the
 * picture to drift. `Math.cos`, `Math.sin`, `Math.atan2` and `Math.hypot` may
 * differ in their last bit between V8 builds, but that only changes a pixel if
 * it moves a sample point across a shape boundary it was already within about
 * 1e-14 of - the spacing of doubles near the ~128 coordinates these shapes are
 * built from - which is vanishingly unlikely against a sample grid spaced 0.25
 * apart. If one ever did, at SAMPLES=4 that single sample would move the pixel
 * by at least about 8 levels in some channel: 8.4 where a brace meets the tile
 * (BRACE 148,166,176 against INK 34,40,42, so 134/16 on blue), 12 where the
 * trefoil meets it (232-40 = 192, /16, on green), and about 16 on the tile's
 * outer edge, where the alpha itself steps. So it would fail the test, which is
 * the wanted behaviour, because the drawn picture really would have changed.
 * Today the measured worst difference is 0.
 * Run this by hand when the design changes, look at the result, and commit it.
 *
 * No dependencies and nothing to install: the rasteriser samples analytic
 * shapes (rounded rectangle, circle, annular sector, arc and segment strokes)
 * on a 4x4 grid per pixel for anti-aliasing, and the PNG writer is
 * `zlib.deflateSync` plus a hand-rolled CRC-32 table. `zlib.crc32` would do,
 * but it only exists from Node 22.2 and `engines.node` says `>=22`. Nothing
 * here reads the clock, a random source or an external file, so two runs
 * produce byte-identical output.
 *
 * The design is original artwork: a dark rounded tile, the generic ISO 361
 * radiation trefoil in yellow-green, and a pair of curly braces framing it -
 * "radiation + code". It reproduces no Nuclear Throne or Vlambeer sprite,
 * character, logo or other trademark.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as zlib from 'zlib';

const ROOT = path.resolve(__dirname, '..', '..');
const OUT_FILE = path.join(ROOT, 'resources', 'icon.png');

/** Marketplace wants at least 128x128; 256 is the usual submission size. */
const SIZE = 256;
/** Anti-aliasing: SAMPLES x SAMPLES points per pixel. */
const SAMPLES = 4;

const TAU = Math.PI * 2;
const rad = (deg: number): number => (deg * Math.PI) / 180;

// --- palette -------------------------------------------------------------

type Rgb = readonly [number, number, number];

/**
 * The tile. Dark, but deliberately lighter and cooler than VS Code Dark
 * Modern's #181818 editor ground, so the icon reads as a tile there instead of
 * dissolving into the background.
 */
const INK: Rgb = [34, 40, 42];
/** The trefoil. Yellow-green, the "radiation" half of the mark. */
const GLOW: Rgb = [190, 232, 51];
/** The braces. Cool grey, the "code" half; quieter than the trefoil. */
const BRACE: Rgb = [148, 166, 176];

// --- shapes --------------------------------------------------------------

/** A shape is a coverage test in pixel coordinates. Later shapes paint over earlier ones. */
type Test = (x: number, y: number) => boolean;
interface Shape { test: Test; color: Rgb; }

/** Axis-aligned rounded rectangle, given its centre, half-extents and corner radius. */
function roundedRect(cx: number, cy: number, hw: number, hh: number, r: number): Test {
	return (x, y) => {
		const dx = Math.max(Math.abs(x - cx) - (hw - r), 0);
		const dy = Math.max(Math.abs(y - cy) - (hh - r), 0);
		return dx * dx + dy * dy <= r * r;
	};
}

function disc(cx: number, cy: number, r: number): Test {
	return (x, y) => {
		const dx = x - cx;
		const dy = y - cy;
		return dx * dx + dy * dy <= r * r;
	};
}

/** Distance from a point to the segment a-b. */
function distToSegment(x: number, y: number,
	ax: number, ay: number, bx: number, by: number): number {
	const vx = bx - ax;
	const vy = by - ay;
	const len2 = vx * vx + vy * vy;
	const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((x - ax) * vx + (y - ay) * vy) / len2));
	const dx = x - (ax + t * vx);
	const dy = y - (ay + t * vy);
	return Math.hypot(dx, dy);
}

/** A straight stroke of width `2 * hw` with round caps. */
function capsule(ax: number, ay: number, bx: number, by: number, hw: number): Test {
	return (x, y) => distToSegment(x, y, ax, ay, bx, by) <= hw;
}

/**
 * A stroke of width `2 * hw` along the arc of radius `r` around (cx, cy)
 * between the angles `from` and `to` (degrees, screen coordinates: y grows
 * downwards, so angles run clockwise from the +x axis). Round caps, so
 * consecutive arcs and segments join without a notch.
 */
function arcStroke(cx: number, cy: number, r: number,
	from: number, to: number, hw: number): Test {
	const t0 = rad(from);
	const t1 = rad(to);
	const capA = disc(cx + r * Math.cos(t0), cy + r * Math.sin(t0), hw);
	const capB = disc(cx + r * Math.cos(t1), cy + r * Math.sin(t1), hw);
	return (x, y) => {
		const dx = x - cx;
		const dy = y - cy;
		if (Math.abs(Math.hypot(dx, dy) - r) <= hw) {
			let a = Math.atan2(dy, dx);
			while (a < t0) { a += TAU; }
			if (a <= t1) { return true; }
		}
		return capA(x, y) || capB(x, y);
	};
}

/**
 * One blade of the trefoil: the part of the annulus between `r0` and `r1`
 * within `half` degrees either side of the direction `centre`.
 */
function annularSector(cx: number, cy: number, r0: number, r1: number,
	centre: number, half: number): Test {
	const mid = rad(centre);
	const span = rad(half);
	return (x, y) => {
		const dx = x - cx;
		const dy = y - cy;
		const d = Math.hypot(dx, dy);
		if (d < r0 || d > r1) { return false; }
		let a = Math.atan2(dy, dx) - mid;
		while (a < -Math.PI) { a += TAU; }
		while (a > Math.PI) { a -= TAU; }
		return Math.abs(a) <= span;
	};
}

/**
 * A curly brace, drawn as four quarter-arcs joined by two straight segments:
 * the two terminals and the middle tip point in opposite directions.
 * `side` is +1 for `{` (tip to the left) and -1 for `}`.
 */
function brace(cx: number, cy: number, halfHeight: number, r: number,
	hw: number, side: 1 | -1): Test {
	const y0 = cy - halfHeight;
	const y1 = cy + halfHeight;
	const parts: Test[] = [
		arcStroke(cx + r, y0 + r, r, 180, 270, hw),   // top terminal, curling in
		capsule(cx, y0 + r, cx, cy - r, hw),          // upper spine
		arcStroke(cx - r, cy - r, r, 0, 90, hw),      // into the middle tip
		arcStroke(cx - r, cy + r, r, 270, 360, hw),   // out of the middle tip
		capsule(cx, cy + r, cx, y1 - r, hw),          // lower spine
		arcStroke(cx + r, y1 - r, r, 90, 180, hw),    // bottom terminal
	];
	// Mirror the canonical `{` about x = cx for the closing brace.
	return (x, y) => {
		const mx = cx + side * (x - cx);
		for (const part of parts) {
			if (part(mx, y)) { return true; }
		}
		return false;
	};
}

// --- the design ----------------------------------------------------------

export function buildScene(): Shape[] {
	const mid = SIZE / 2;

	// ISO 361 proportions: central disc of radius u, blades from 1.5u to 5u,
	// three 60-degree blades separated by 60-degree gaps, one pointing up.
	const u = 58 / 5;
	const blades: Shape[] = [-90, 30, 150].map((angle) => ({
		test: annularSector(mid, mid, 1.5 * u, 5 * u, angle, 30),
		color: GLOW,
	}));

	return [
		{ test: roundedRect(mid, mid, mid, mid, 52), color: INK },
		{ test: disc(mid, mid, u), color: GLOW },
		...blades,
		{ test: brace(40, mid, 70, 22, 5.5, 1), color: BRACE },
		{ test: brace(SIZE - 40, mid, 70, 22, 5.5, -1), color: BRACE },
	];
}

// --- rasteriser ----------------------------------------------------------

/** RGBA8, row-major, `SIZE * SIZE * 4` bytes. */
export function render(scene: Shape[]): Buffer {
	const pixels = Buffer.alloc(SIZE * SIZE * 4);
	const step = 1 / SAMPLES;
	const total = SAMPLES * SAMPLES;

	for (let py = 0; py < SIZE; py++) {
		for (let px = 0; px < SIZE; px++) {
			let r = 0;
			let g = 0;
			let b = 0;
			let hits = 0;
			for (let sy = 0; sy < SAMPLES; sy++) {
				const y = py + (sy + 0.5) * step;
				for (let sx = 0; sx < SAMPLES; sx++) {
					const x = px + (sx + 0.5) * step;
					let colour: Rgb | undefined;
					for (const shape of scene) {
						if (shape.test(x, y)) { colour = shape.color; }
					}
					if (colour === undefined) { continue; }
					r += colour[0];
					g += colour[1];
					b += colour[2];
					hits++;
				}
			}
			const at = (py * SIZE + px) * 4;
			if (hits > 0) {
				// Straight (non-premultiplied) alpha: the colour is the average
				// over the covered samples, the alpha is the coverage.
				pixels[at] = Math.round(r / hits);
				pixels[at + 1] = Math.round(g / hits);
				pixels[at + 2] = Math.round(b / hits);
				pixels[at + 3] = Math.round((hits * 255) / total);
			}
		}
	}
	return pixels;
}

// --- PNG writer ----------------------------------------------------------

const CRC_TABLE = (() => {
	const table = new Int32Array(256);
	for (let n = 0; n < 256; n++) {
		let c = n;
		for (let k = 0; k < 8; k++) { c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; }
		table[n] = c;
	}
	return table;
})();

function crc32(buf: Buffer): number {
	let c = -1;
	for (let i = 0; i < buf.length; i++) { c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8); }
	return (c ^ -1) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
	const head = Buffer.alloc(4);
	head.writeUInt32BE(data.length, 0);
	const body = Buffer.concat([Buffer.from(type, 'latin1'), data]);
	const tail = Buffer.alloc(4);
	tail.writeUInt32BE(crc32(body), 0);
	return Buffer.concat([head, body, tail]);
}

/** 8-bit RGBA (colour type 6), no interlacing, filter type 0 on every scanline. */
function encodePng(pixels: Buffer, width: number, height: number): Buffer {
	const ihdr = Buffer.alloc(13);
	ihdr.writeUInt32BE(width, 0);
	ihdr.writeUInt32BE(height, 4);
	ihdr[8] = 8;   // bit depth
	ihdr[9] = 6;   // colour type: truecolour with alpha
	ihdr[10] = 0;  // compression: deflate
	ihdr[11] = 0;  // filter method: adaptive, and every scanline uses filter 0
	ihdr[12] = 0;  // interlace: none

	const stride = width * 4;
	const raw = Buffer.alloc(height * (stride + 1));
	// The filter byte before each scanline stays 0; Buffer.alloc zero-fills.
	for (let y = 0; y < height; y++) {
		pixels.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
	}

	return Buffer.concat([
		Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
		chunk('IHDR', ihdr),
		chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
		chunk('IEND', Buffer.alloc(0)),
	]);
}

// --- main ----------------------------------------------------------------

function fail(message: string): never {
	console.error('render-icon: ' + message);
	process.exit(1);
	throw new Error(message); // unreachable; keeps the return type honest
}

/** Unlike `generate-grammar --out`, which names a directory, this names a file. */
function parseArgv(argv: string[]): string {
	let out = OUT_FILE;
	for (let i = 0; i < argv.length; i++) {
		const a = argv[i];
		if (a === '--out') {
			const file = argv[++i];
			if (file === undefined) { fail('--out needs a file path'); }
			out = path.resolve(file);
		} else if (a.indexOf('--out=') === 0) {
			out = path.resolve(a.slice('--out='.length));
		} else if (a === '--help' || a === '-h') {
			console.log('usage: render-icon [--out <file>]');
			process.exit(0);
		} else {
			fail('unknown argument: ' + a);
		}
	}
	return out;
}

function main(): void {
	const out = parseArgv(process.argv.slice(2));
	const png = encodePng(render(buildScene()), SIZE, SIZE);
	fs.mkdirSync(path.dirname(out), { recursive: true });
	fs.writeFileSync(out, png);
	console.log(path.relative(ROOT, out).replace(/\\/g, '/') + '  ' +
		SIZE + 'x' + SIZE + ' RGBA  ' + png.length + ' bytes');
}

if (require.main === module) { main(); }
