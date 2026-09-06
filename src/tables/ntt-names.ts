/**
 * NTT-only identifier families that the dump's own metadata does not mark.
 *
 * `src/provider/items.ts` decides the "NTT-specific" sort tier from the
 * tables: a self/other prefix, `${raw}`, a `... API` fold group, or an
 * `NTT-*.dmd` documentation page. Roughly fifty functions that exist only in
 * Nuclear Throne Together carry none of those - `trace`, `fork`, the mod
 * loader, script binding and reflection, chat completion, the non-sync
 * family - because they sit in shared fold groups and are documented in
 * `API-Debug.dmd`, `API-Mods.dmd` and friends. This is the hand-maintained
 * list that covers them, from NTGML-SPEC.md section 7 and `api/ntt-docs`.
 *
 * Keep it small: a family only belongs here when the generated metadata
 * genuinely cannot express it. Everything here is verified absent from stock
 * GameMaker.
 */

/** Prefixes: every function whose name starts with one is NTT-only. */
const NTT_PREFIXES: string[] = [
	// `trace`, `trace_color`, `trace_time` - NTT's console output (API-Debug).
	'trace',
	// Mod loading, reflection and inter-mod calls (API-Mods).
	'mod_',
	// `script_bind_step` and the rest of the binding family (API-Scripts).
	'script_bind_',
	// `script_ref_create`, `script_ref_create_ext` (API-Scripts).
	'script_ref_',
	// Chat auto-completion hooks (API-Chat).
	'chat_comp_',
	// `sprite_add_weapon`, `sprite_add_weapon_base64` (API-Sprites).
	'sprite_add_weapon',
	// NTT's own array functions, taking a real GML array rather than a ds_list
	// (API-Arrays).
	'native_array_',
	// The legacy struct ("lightweight query") family (API-Structs).
	'lq_',
];

/**
 * Suffix for the non-sync family: `random_nonsync`,
 * `game_screen_get_width_nonsync`, `button_check_nonsync` and the rest. These
 * read state that differs between peers, so they exist only in NTT.
 */
const NTT_SUFFIX = '_nonsync';

/** Exact names with no family to key off. */
const NTT_NAMES: string[] = [
	// The mod-thread keyword-like call (NTGML-SPEC.md section 2.6).
	'fork',
	// Script reflection (API-Scripts). `script_get_name` is stock GameMaker,
	// so it is not listed.
	'script_get_index',
	// Crown selection (API-Game).
	'crown_get_pick',
	'crown_set_pick',
	// Run control (API-Game). `game_restart` is stock GameMaker, so it is not
	// listed.
	'game_set_seed',
	'game_set_size',
	// Drawing helpers NTT adds on top of the GameMaker draw_ family
	// (API-Drawing).
	'draw_text_nt',
	'draw_tooltip',
	'draw_rect_ext',
	// String helpers (API-Strings).
	'string_auto',
	'string_ext',
	// Surface helpers that survive a lost surface (API-Surfaces).
	'surface_valid',
	'surface_destroy_soft',
	// Sprite helpers (API-Sprites).
	'sprite_duplicate_ext',
	// Type and value helpers (API-Types).
	'is_builtin',
	'double',
];

const exact: { [name: string]: true } = {};
for (const name of NTT_NAMES) { exact[name] = true; }

/** Whether `name` belongs to one of the hand-listed NTT-only families. */
export function isNTTName(name: string): boolean {
	if (exact[name] === true) { return true; }
	if (name.length > NTT_SUFFIX.length && name.endsWith(NTT_SUFFIX)) { return true; }
	return NTT_PREFIXES.some((p) => name.startsWith(p));
}
