/**
 * Callback fields of the NTT custom object family.
 *
 * Hand-maintained from `NTGML-SPEC.md` §8.2, cross-checked against
 * `api/ntt-docs/ref/Custom*.gml`: every entry's fields are the ones its
 * `#event create` (and, for `CustomPickup`, `CustomPickup_init.gml`) actually
 * assigns, and its parent is the `parent_index` on line 2 of that file.
 *
 * A parent that is itself in this table is `extends` and its fields are
 * inherited (use `fieldsFor`). A parent that is an engine object is
 * `engineParent`, which is recorded for documentation only: the docs ship no
 * list of engine instance variables, so nothing is derived from it -
 * `CustomHitme` derives from `hitme` and `CustomEnemy` from `enemy`, so
 * neither gets `CustomObject`'s `sprite_visible`, which only `CustomObject`'s
 * draw event honours.
 *
 * Engine variables are therefore listed explicitly, under one rule: an entry
 * lists an engine variable when its own reference file reads or assigns it
 * *on `self`*. Three exclusions keep that rule from swallowing everything:
 *
 * - Variables already in `src/generated/variables.ts` (`sprite_index`,
 *   `image_index`, `speed`, `visible`, `current_frame`, ...). They are offered
 *   from the dump's own built-in list; repeating them here would double them.
 * - Accesses to the *colliding* instance rather than this one: `other.x` in a
 *   collision event (`other.deflected`, `other.team`, `other.typ` in
 *   `CustomSlash.gml:19-26`, `other.team` in `CustomProjectile.gml:38`) and
 *   bare names inside a `with (other) { ... }` block, where `self` is rebound
 *   (`deflected = 1`, `direction`, `alarm[1]` in `CustomSlash.gml:38-46`, the
 *   nested `with (Player) { with (other) ... }` in `CustomPickup.gml:43-47`).
 *   None of these is ever assigned on the object's own `self`. GML's built-in
 *   `alarm[]` array (`CustomPickup.gml:11`) is a language feature, not a field.
 * - Internal double-underscore markers: engine bookkeeping, not fields a mod
 *   sets. `__maxhealth_init` (`CustomEnemy.gml:8`) is the only one.
 */

import { CustomObjectField, CustomObjectInfo } from './types';

function f(names: string, doc?: string): CustomObjectField[] {
	return names.split(/\s+/).filter((n) => n.length > 0).map((name) => ({ name, doc }));
}

export const customObjects: CustomObjectInfo[] = [
	{
		name: 'CustomObject',
		engineParent: 'GameObject',
		fields: [
			...f('on_destroy on_step on_begin_step on_end_step on_draw on_cleanup', 'Event callback.'),
			...f('sprite_visible', 'Whether the default draw event draws `sprite_index`.'),
		],
		doc: 'Base custom object. Set the `on_*` fields to script indices or method values.',
	},
	{
		name: 'CustomHitme',
		engineParent: 'hitme',
		fields: [
			...f('on_destroy on_step on_begin_step on_end_step on_draw on_cleanup on_hurt', 'Event callback.'),
			...f('my_health maxhealth team size raddrop', 'Stat field.'),
			...f('spr_idle spr_walk spr_hurt spr_dead spr_shadow', 'Sprite field.'),
			...f('snd_hurt snd_dead', 'Sound field.'),
		],
		doc: 'Damageable custom object. Derives from the engine `hitme`, not from `CustomObject`.',
	},
	{
		name: 'CustomEnemy',
		engineParent: 'enemy',
		fields: [
			...f(
				'on_destroy on_step on_begin_step on_end_step on_draw on_cleanup on_hurt on_death',
				'Event callback.'
			),
			...f('maxhealth candie meleedamage size hitid raddrop', 'Stat field.'),
			...f('spr_idle spr_walk spr_hurt spr_dead spr_shadow', 'Sprite field.'),
			// Engine-inherited: `enemy` derives from `hitme`, so a CustomEnemy has
			// these even though its own `#event create` never assigns them. Every
			// one is read or set by `api/ntt-docs/ref/CustomEnemy.gml` (`my_health`
			// :36, `wkick` :41, `nexthurt` :60) or by its `hitme` sibling
			// `api/ntt-docs/ref/CustomHitme.gml` (`team` :23, `snd_hurt` :14,
			// `snd_dead` :15).
			...f('my_health team', 'Engine `hitme` instance variable.'),
			...f('snd_hurt snd_dead', 'Engine `hitme` sound variable.'),
			...f('wkick nexthurt', 'Engine instance variable read by the default events.'),
		],
		doc: 'Enemy custom object. Derives from the engine `enemy`, not from `CustomHitme`.',
	},
	{
		name: 'CustomProp',
		engineParent: 'prop',
		fields: [
			...f('on_step on_death on_draw', 'Event callback.'),
			...f('size maxhealth', 'Stat field.'),
			...f('spr_idle spr_hurt spr_dead', 'Sprite field.'),
			...f('snd_hurt', 'Sound field.'),
			// Engine-inherited from `prop`, read by the default step event
			// (`api/ntt-docs/ref/CustomProp.gml:24`) but never assigned in
			// `#event create`.
			...f('my_health', 'Engine `prop` instance variable.'),
		],
		doc: 'Destructible prop.',
	},
	{
		name: 'CustomProjectile',
		engineParent: 'projectile',
		fields: [
			...f(
				'on_wall on_hit on_anim on_draw on_step on_begin_step on_end_step on_destroy on_cleanup',
				'Event callback.'
			),
			// Engine-inherited from `projectile`, read by the default `hitme`
			// collision (`api/ntt-docs/ref/CustomProjectile.gml:38` for `team`,
			// `:42` for `damage` and `force`) but never assigned in
			// `#event create`. `CustomSlash` inherits them and reads `team` at
			// `api/ntt-docs/ref/CustomSlash.gml:15`.
			...f('team damage force', 'Engine `projectile` instance variable.'),
		],
		doc: 'Custom projectile.',
	},
	{
		name: 'CustomSlash',
		extends: 'CustomProjectile',
		fields: [
			...f('on_grenade on_projectile', 'Event callback.'),
			...f('typ candeflect', 'Stat field.'),
		],
		doc: 'Custom melee slash.',
	},
	{
		name: 'CustomChest',
		engineParent: 'chestprop',
		fields: [
			...f(
				'on_anim on_draw on_step on_begin_step on_end_step on_destroy on_cleanup on_open',
				'Event callback.'
			),
			...f('can_hatred can_shine', 'Flag field.'),
		],
		doc: 'Custom chest / pickup crate.',
	},
	{
		name: 'CustomPickup',
		engineParent: 'PickupBox',
		fields: [
			...f('on_pickup on_step on_draw on_disappear on_find_target on_attract', 'Event callback.'),
			...f('blink attract_speed', 'Stat field.'),
			...f('spr_fade spr_pickup', 'Sprite field.'),
			...f('snd_pickup snd_disappear', 'Sound field.'),
		],
		doc: 'Custom floor pickup.',
	},
	{
		name: 'CustomScript',
		fields: f('script', 'Script the bind call was given; run every time the event fires.'),
		doc: 'Base of the `script_bind_*` objects.',
	},
	{
		name: 'CustomBeginStep',
		extends: 'CustomScript',
		fields: [],
		doc: 'Created by `script_bind_begin_step`.',
	},
	{
		name: 'CustomStep',
		extends: 'CustomScript',
		fields: [],
		doc: 'Created by `script_bind_step`.',
	},
	{
		name: 'CustomEndStep',
		extends: 'CustomScript',
		fields: [],
		doc: 'Created by `script_bind_end_step`.',
	},
	{
		name: 'CustomDraw',
		extends: 'CustomScript',
		fields: [],
		doc: 'Created by `script_bind_draw`.',
	},
];

const byName: { [name: string]: CustomObjectInfo } = {};
for (const o of customObjects) { byName[o.name] = o; }

export function customObject(name: string): CustomObjectInfo | undefined {
	return byName[name];
}

/** Fields of an object including everything it inherits, base class first. */
export function fieldsFor(name: string): CustomObjectField[] {
	const out: CustomObjectField[] = [];
	const seen: { [n: string]: true } = {};
	const chain: CustomObjectInfo[] = [];
	const walked: { [n: string]: true } = {};
	let cur: CustomObjectInfo | undefined = byName[name];
	// `walked` guards against a cyclic `extends` in the table above: a typo that
	// made two entries each other's parent would otherwise hang the extension host.
	while (cur !== undefined && !walked[cur.name]) {
		walked[cur.name] = true;
		chain.unshift(cur);
		cur = cur.extends !== undefined ? byName[cur.extends] : undefined;
	}
	for (const o of chain) {
		for (const field of o.fields) {
			if (seen[field.name]) { continue; }
			seen[field.name] = true;
			out.push(field);
		}
	}
	return out;
}

/** Every custom-object callback field name, deduplicated and sorted. */
export const customObjectFields: string[] = (() => {
	const set: { [n: string]: true } = {};
	for (const o of customObjects) {
		for (const field of o.fields) { set[field.name] = true; }
	}
	return Object.keys(set).sort();
})();
