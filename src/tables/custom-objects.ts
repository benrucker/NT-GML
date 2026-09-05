/**
 * Callback fields of the NTT custom object family.
 *
 * Hand-maintained from `NTGML-SPEC.md` §8.2, cross-checked against
 * `api/ntt-docs/ref/Custom*.gml`. Fields listed on an object are the ones it
 * declares itself; `extends` chains the inherited ones (use `fieldsFor`).
 */

import { CustomObjectField, CustomObjectInfo } from './types';

function f(names: string, doc?: string): CustomObjectField[] {
	return names.split(/\s+/).filter((n) => n.length > 0).map((name) => ({ name, doc }));
}

export const customObjects: CustomObjectInfo[] = [
	{
		name: 'CustomObject',
		fields: [
			...f('on_destroy on_step on_begin_step on_end_step on_draw on_cleanup', 'Event callback.'),
			...f('sprite_visible', 'Whether the default draw event draws `sprite_index`.'),
		],
		doc: 'Base custom object. Set the `on_*` fields to script indices or method values.',
	},
	{
		name: 'CustomHitme',
		extends: 'CustomObject',
		fields: [
			...f('on_hurt', 'Event callback.'),
			...f('my_health maxhealth team size raddrop', 'Stat field.'),
			...f('spr_idle spr_walk spr_hurt spr_dead spr_shadow', 'Sprite field.'),
			...f('snd_hurt snd_dead', 'Sound field.'),
		],
		doc: 'Damageable custom object.',
	},
	{
		name: 'CustomEnemy',
		extends: 'CustomHitme',
		fields: [
			...f('on_death', 'Event callback.'),
			...f('candie meleedamage hitid', 'Stat field.'),
		],
		doc: 'Enemy custom object.',
	},
	{
		name: 'CustomProp',
		fields: [
			...f('on_step on_death on_draw', 'Event callback.'),
			...f('size maxhealth', 'Stat field.'),
			...f('spr_idle spr_hurt spr_dead', 'Sprite field.'),
			...f('snd_hurt', 'Sound field.'),
		],
		doc: 'Destructible prop.',
	},
	{
		name: 'CustomProjectile',
		fields: f(
			'on_wall on_hit on_anim on_draw on_step on_begin_step on_end_step on_destroy on_cleanup',
			'Event callback.'
		),
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
		fields: [
			...f('on_pickup on_step on_draw on_disappear on_find_target on_attract', 'Event callback.'),
			...f('blink attract_speed', 'Stat field.'),
			...f('spr_fade spr_pickup', 'Sprite field.'),
			...f('snd_pickup snd_disappear', 'Sound field.'),
		],
		doc: 'Custom floor pickup.',
	},
	{
		name: 'CustomBeginStep',
		fields: f('script', 'Script bound via `script_bind_begin_step`.'),
		doc: 'Created by `script_bind_begin_step`.',
	},
	{
		name: 'CustomStep',
		fields: f('script', 'Script bound via `script_bind_step`.'),
		doc: 'Created by `script_bind_step`.',
	},
	{
		name: 'CustomEndStep',
		fields: f('script', 'Script bound via `script_bind_end_step`.'),
		doc: 'Created by `script_bind_end_step`.',
	},
	{
		name: 'CustomDraw',
		fields: f('script', 'Script bound via `script_bind_draw`.'),
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
	let cur: CustomObjectInfo | undefined = byName[name];
	while (cur !== undefined) {
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
