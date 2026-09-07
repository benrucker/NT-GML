/**
 * Chain walking over the generated per-object instance-variable table.
 *
 * `src/generated/object-fields.ts` stores only what each object DECLARES, the
 * way `fields.gml` would if it did not repeat inherited names on every child.
 * The helpers here put a chain back together, and answer which object in that
 * chain declares a given name - which is what the completion detail line
 * ("inherited from hitme") needs.
 *
 * The walks are cycle-guarded exactly like `fieldsFor` in `custom-objects.ts`;
 * the generator already fails on a cycle, so the guard is belt and braces.
 */

import { objectFields, objectFieldsByName } from '../generated/object-fields';
import { ObjectFieldInfo, ObjectFieldsInfo } from './types';

export { objectFields, objectFieldsByName };

/** Is `name` an object the field table knows? */
export function knownFieldObject(name: string): boolean {
	return objectFieldsByName(name) !== undefined;
}

/** The object's chain, base class first, ending with the object itself. */
function chainOf(name: string): ObjectFieldsInfo[] {
	const chain: ObjectFieldsInfo[] = [];
	const walked: { [n: string]: true } = {};
	let cur = objectFieldsByName(name);
	while (cur !== undefined && walked[cur.name] === undefined) {
		walked[cur.name] = true;
		chain.unshift(cur);
		cur = cur.parent === undefined ? undefined : objectFieldsByName(cur.parent);
	}
	return chain;
}

/**
 * Every instance variable `name` has, inherited ones first, deduped by name.
 * The generator guarantees a name is declared once per chain, so the dedupe
 * only guards against a future table. Empty for an object with no entry.
 */
export function fieldsFor(name: string): ObjectFieldInfo[] {
	const out: ObjectFieldInfo[] = [];
	const seen: { [n: string]: true } = {};
	for (const entry of chainOf(name)) {
		for (const field of entry.fields) {
			if (seen[field.name]) { continue; }
			seen[field.name] = true;
			out.push(field);
		}
	}
	return out;
}

/**
 * Which object in `name`'s chain declares `field`, or undefined when nothing
 * in the chain does. Equal to `name` itself when the object declares it.
 */
export function declaringObject(name: string, field: string): string | undefined {
	const chain = chainOf(name);
	for (let i = chain.length - 1; i >= 0; i--) {
		if (chain[i].fields.some((f) => f.name === field)) { return chain[i].name; }
	}
	return undefined;
}
