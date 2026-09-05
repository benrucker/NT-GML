/**
 * Reserved mod event names per mod file type.
 *
 * Hand-maintained from `NTGML-SPEC.md` §8.1. `engine: true` marks names that
 * are documented and/or confirmed in the game binary's string tables (`[bin]`);
 * `engine: false` marks mod-local conventions that no engine dispatch uses -
 * they are still worth completing (real mods define them) but should rank
 * below the engine ones.
 *
 * Every mod type also has `init` and `cleanup`; they are included in each
 * type's list so `modEvents[type]` is complete on its own.
 */

import { ModEventInfo, ModType } from './types';

/** `init` and `cleanup` exist for every mod type (NTGML-SPEC.md §4). */
const common: ModEventInfo[] = [
	{
		name: 'init',
		args: [],
		engine: true,
		doc: 'Runs when the mod loads. Code before the first `#define`/`function` is the implicit `init`.',
	},
	{
		name: 'cleanup',
		args: [],
		engine: true,
		doc: 'Runs when the mod is unloaded or reloaded.',
	},
];

const modType: ModEventInfo[] = [
	...common,
	{ name: 'game_start', args: [], engine: true, doc: 'Runs when a run starts.' },
	{ name: 'game_end', args: [], engine: true, doc: 'Runs when a run ends. Confirmed in the game binary.' },
	{ name: 'mod_load', args: [], engine: true, doc: 'Runs when another mod is loaded. Confirmed in the game binary.' },
	{ name: 'mod_unload', args: [], engine: true, doc: 'Runs when another mod is unloaded. Confirmed in the game binary.' },
	{ name: 'step', args: [], engine: true, doc: 'Runs every frame.' },
	{ name: 'draw', args: [], engine: true, doc: 'Draws in world space.' },
	{ name: 'draw_shadows', args: [], engine: true, doc: 'Draws into the shadow pass.' },
	{ name: 'draw_bloom', args: [], engine: true, doc: 'Draws into the bloom pass.' },
	{ name: 'draw_dark', args: [], engine: true, doc: 'Draws into the darkness pass.' },
	{ name: 'draw_dark_begin', args: [], engine: true, doc: 'Runs before the darkness pass.' },
	{ name: 'draw_dark_end', args: [], engine: true, doc: 'Runs after the darkness pass.' },
	{ name: 'draw_gui', args: [], engine: true, doc: 'Draws in GUI space.' },
	{ name: 'draw_gui_end', args: [], engine: true, doc: 'Draws in GUI space, after everything else.' },
	{ name: 'draw_pause', args: [], engine: true, doc: 'Draws while the game is paused.' },
	{
		name: 'chat_command',
		args: ['command', 'parameter', 'player'],
		engine: true,
		doc: 'Handles a chat command. Return `true` if the command was handled.',
	},
	{ name: 'chat_message', args: ['message', 'player'], engine: true, doc: 'Runs for each chat message.' },
	{ name: 'level_start', args: [], engine: false, note: 'Mod-local convention; absent from the game binary.' },
	{ name: 'save_options', args: [], engine: false, note: 'Mod-local convention; absent from the game binary.' },
	{ name: 'load_options', args: [], engine: false, note: 'Mod-local convention; absent from the game binary.' },
];

const wepType: ModEventInfo[] = [
	...common,
	{ name: 'weapon_name', args: ['wep'], engine: true, doc: 'Display name of the weapon.' },
	{ name: 'weapon_text', args: [], engine: true, doc: 'Pickup/description text.' },
	{ name: 'weapon_type', args: [], engine: true, doc: 'Ammo type (0-5).' },
	{ name: 'weapon_auto', args: [], engine: true, doc: 'Whether the weapon fires while the button is held.' },
	{ name: 'weapon_load', args: [], engine: true, doc: 'Reload time in frames.' },
	{ name: 'weapon_cost', args: [], engine: true, doc: 'Ammo cost per shot.' },
	{ name: 'weapon_rads', args: [], engine: true, doc: 'Rad cost of the weapon.' },
	{ name: 'weapon_swap', args: [], engine: true, doc: 'Sound played when the weapon is swapped to.' },
	{ name: 'weapon_melee', args: [], engine: true, doc: 'Whether the weapon counts as melee.' },
	{ name: 'weapon_area', args: [], engine: true, doc: 'Area the weapon can be found in.' },
	{ name: 'weapon_sprt', args: [], engine: true, doc: 'World sprite of the weapon.' },
	{ name: 'weapon_sprt_hud', args: [], engine: true, doc: 'HUD sprite of the weapon.' },
	{ name: 'weapon_loadout', args: [], engine: true, doc: 'Whether the weapon can appear in loadouts.' },
	{ name: 'weapon_laser_sight', args: [], engine: true, doc: 'Whether the weapon shows a laser sight.' },
	{ name: 'weapon_gold', args: [], engine: true, doc: 'Whether the weapon counts as golden.' },
	{ name: 'weapon_pan_factor', args: [], engine: true, doc: 'Screen pan factor while aiming (100.025).' },
	{ name: 'weapon_fire', args: ['wep'], engine: true, doc: 'Runs when the weapon is fired.' },
	{ name: 'weapon_reloaded', args: ['primary'], engine: true, doc: 'Runs when the weapon finishes reloading.' },
	{ name: 'step', args: ['primary'], engine: true, doc: 'Runs every frame while the weapon is held.' },
	{ name: 'weapon_avail', args: [], engine: false, note: 'Absent from the game binary; NTTE dispatches it via `mod_script_call`.' },
	{ name: 'weapon_chrg', args: [], engine: false, note: 'Absent from the game binary; NTTE dispatches it via `mod_script_call`.' },
	{ name: 'weapon_shrine', args: [], engine: false, note: 'Absent from the game binary; NTTE dispatches it via `mod_script_call`.' },
	{ name: 'weapon_extra', args: [], engine: false, note: 'Mod-local convention; absent from the game binary.' },
	{ name: 'weapon_canspec', args: [], engine: false, note: 'Mod-local convention; absent from the game binary.' },
	{ name: 'weapon_cost_base', args: [], engine: false, note: 'Mod-local convention; absent from the game binary.' },
	{ name: 'weapon_maxchrg', args: [], engine: false, note: 'Mod-local convention; absent from the game binary.' },
	{ name: 'weapon_chrg_cost', args: [], engine: false, note: 'Mod-local convention; absent from the game binary.' },
	{ name: 'weapon_fireOnRelease', args: [], engine: false, note: 'Mod-local convention; absent from the game binary.' },
	{ name: 'weapon_burst', args: [], engine: false, note: 'Mod-local convention; absent from the game binary.' },
	{ name: 'weapon_burst_time', args: [], engine: false, note: 'Mod-local convention; absent from the game binary.' },
	{ name: 'weapon_red', args: [], engine: false, note: 'Mod-local convention; absent from the game binary.' },
	{ name: 'weapon_reload', args: [], engine: false, note: 'Mod-local helper, not an event.' },
	{ name: 'weapon_load_full', args: [], engine: false, note: 'Mod-local helper, not an event.' },
	{ name: 'weapon_fire_charged', args: [], engine: false, note: 'Mod-local helper, not an event.' },
	{ name: 'weapon_fire_uncharged', args: [], engine: false, note: 'Mod-local helper, not an event.' },
];

const raceType: ModEventInfo[] = [
	...common,
	{ name: 'race_name', args: [], engine: true, doc: 'Display name of the race.' },
	{ name: 'race_text', args: [], engine: true, doc: 'Description text.' },
	{ name: 'race_swep', args: [], engine: true, doc: 'Starting weapon.' },
	{ name: 'race_mapicon', args: ['player_index', 'skin'], engine: true, doc: 'Map icon sprite.' },
	{ name: 'race_portrait', args: ['player_index', 'skin'], engine: true, doc: 'Character-select portrait sprite.' },
	{ name: 'race_ttip', args: [], engine: true, doc: 'Tooltip text.' },
	{ name: 'race_menu_button', args: [], engine: true, doc: 'Character-select button sprite.' },
	{ name: 'race_soundbank', args: [], engine: true, doc: 'Sound bank used for the race.' },
	{ name: 'race_menu_select', args: [], engine: true, doc: 'Runs when the race is highlighted in the menu.' },
	{ name: 'race_menu_confirm', args: [], engine: true, doc: 'Runs when the race is confirmed in the menu.' },
	{ name: 'game_start', args: [], engine: true, doc: 'Runs when a run starts.' },
	{ name: 'create', args: [], engine: true, doc: 'Runs when the player instance is created.' },
	{ name: 'step', args: [], engine: true, doc: 'Runs every frame for the player.' },
	{ name: 'draw_begin', args: [], engine: true, doc: 'Draws before the player sprite.' },
	{ name: 'draw', args: [], engine: true, doc: 'Draws the player.' },
	{ name: 'draw_end', args: [], engine: true, doc: 'Draws after the player sprite.' },
	{ name: 'race_avail', args: [], engine: true, doc: 'Whether the race is selectable.' },
	{ name: 'race_lock', args: [], engine: true, doc: 'Whether the race is locked.' },
	{ name: 'race_skins', args: [], engine: true, doc: 'Number of skins the race has.' },
	{ name: 'race_skin_avail', args: ['skin'], engine: true, doc: 'Whether a skin is selectable.' },
	{ name: 'race_skin_name', args: ['skin'], engine: true, doc: 'Display name of a skin.' },
	{ name: 'race_skin_button', args: ['skin'], engine: true, doc: 'Menu button sprite for a skin.' },
	{ name: 'race_tb_text', args: [], engine: true, doc: 'Throne Butt description text.' },
	{ name: 'race_tb_take', args: ['value'], engine: true, doc: 'Runs when Throne Butt is taken.' },
	{ name: 'race_ultra_name', args: ['index'], engine: true, doc: 'Name of an ultra mutation.' },
	{ name: 'race_ultra_text', args: ['index'], engine: true, doc: 'Description of an ultra mutation.' },
	{ name: 'race_ultra_button', args: ['index'], engine: true, doc: 'Menu button sprite for an ultra mutation.' },
	{ name: 'race_ultra_icon', args: ['index'], engine: true, doc: 'Icon sprite for an ultra mutation.' },
	{ name: 'race_ultra_take', args: ['index', 'value'], engine: true, doc: 'Runs when an ultra mutation is taken.' },
	{ name: 'race_ultra_lose', args: ['index'], engine: true, doc: 'Runs when an ultra mutation is lost.' },
	{ name: 'race_gets_chilly', args: [], engine: true, doc: 'Whether the race gets the frozen-city chill effect.' },
	{ name: 'race_makes_air_bubbles', args: [], engine: true, doc: 'Whether the race emits air bubbles underwater (100.007).' },
	{ name: 'race_sprite', args: [], engine: true, doc: 'Sprite override. Confirmed in the game binary.' },
	{ name: 'race_sound', args: [], engine: true, doc: 'Sound override. Confirmed in the game binary.' },
	{ name: 'race_revive_sprite', args: [], engine: true, doc: 'Revive sprite override. Confirmed in the game binary.' },
	{ name: 'race_skin_lock', args: [], engine: false, note: 'Mod-local convention; absent from the game binary.' },
	{ name: 'race_skin_unlock', args: [], engine: false, note: 'Mod-local convention; absent from the game binary.' },
	{ name: 'race_unlock', args: [], engine: false, note: 'Mod-local convention; absent from the game binary.' },
	{ name: 'race_sprite_raw', args: [], engine: false, note: 'Mod-local convention; absent from the game binary.' },
	{ name: 'level_start', args: [], engine: false, note: 'Mod-local convention; absent from the game binary.' },
];

const skinType: ModEventInfo[] = [
	...common,
	{ name: 'skin_race', args: [], engine: true, doc: 'Race this skin belongs to.' },
	{ name: 'game_start', args: [], engine: true, doc: 'Runs when a run starts.' },
	{ name: 'skin_avail', args: [], engine: true, doc: 'Whether the skin is selectable.' },
	{ name: 'skin_name', args: ['locked'], engine: true, doc: 'Display name of the skin.' },
	{ name: 'skin_button', args: [], engine: true, doc: 'Menu button sprite.' },
	{ name: 'skin_portrait', args: ['player_index'], engine: true, doc: 'Character-select portrait sprite.' },
	{ name: 'skin_mapicon', args: ['player_index'], engine: true, doc: 'Map icon sprite.' },
	{ name: 'skin_race_name', args: [], engine: true, doc: 'Race name override shown for this skin.' },
	{ name: 'skin_race_text', args: [], engine: true, doc: 'Race description override shown for this skin.' },
	{ name: 'skin_race_tb_text', args: [], engine: true, doc: 'Throne Butt text override shown for this skin.' },
	{ name: 'create', args: [], engine: true, doc: 'Runs when the player instance is created.' },
	{ name: 'step', args: [], engine: true, doc: 'Runs every frame for the player.' },
	{ name: 'draw_begin', args: [], engine: true, doc: 'Draws before the player sprite.' },
	{ name: 'draw', args: [], engine: true, doc: 'Draws the player.' },
	{ name: 'draw_end', args: [], engine: true, doc: 'Draws after the player sprite.' },
	{ name: 'skin_sound', args: [], engine: true, doc: 'Sound override.' },
	{ name: 'skin_sprite', args: [], engine: true, doc: 'Sprite override (100.025).' },
	{ name: 'skin_ttip', args: [], engine: true, doc: 'Tooltip text. Confirmed in the game binary.' },
	{ name: 'skin_revive_sprite', args: [], engine: true, doc: 'Revive sprite override. Confirmed in the game binary.' },
	{ name: 'skin_lock', args: [], engine: false, note: 'Mod-local convention; absent from the game binary.' },
	{ name: 'skin_unlock', args: [], engine: false, note: 'Mod-local convention; absent from the game binary.' },
	{ name: 'skin_weapon_sprite', args: [], engine: false, note: 'Mod-local convention; absent from the game binary.' },
	{ name: 'skin_weapon_sprite_hud', args: [], engine: false, note: 'Mod-local convention; absent from the game binary.' },
	{ name: 'skin_weapon_swap', args: [], engine: false, note: 'Mod-local convention; absent from the game binary.' },
];

const skillType: ModEventInfo[] = [
	...common,
	{ name: 'game_start', args: [], engine: true, doc: 'Runs when a run starts.' },
	{ name: 'step', args: [], engine: true, doc: 'Runs every frame while the skill is held.' },
	{ name: 'skill_name', args: [], engine: true, doc: 'Display name of the mutation.' },
	{ name: 'skill_text', args: [], engine: true, doc: 'Description text.' },
	{ name: 'skill_tip', args: [], engine: true, doc: 'Tooltip text.' },
	{ name: 'skill_icon', args: [], engine: true, doc: 'Icon sprite.' },
	{ name: 'skill_button', args: [], engine: true, doc: 'Mutation-select button sprite.' },
	{ name: 'skill_avail', args: [], engine: true, doc: 'Whether the mutation is offered.' },
	{ name: 'skill_take', args: [], engine: true, doc: 'Runs when the mutation is taken.' },
	{ name: 'skill_lose', args: [], engine: true, doc: 'Runs when the mutation is lost.' },
	{ name: 'skill_wepspec', args: [], engine: true, doc: 'Weapon-specific behaviour hook.' },
	{ name: 'skill_sound', args: [], engine: false, note: 'Mod-local convention; not an engine callback.' },
	{ name: 'skill_rat', args: [], engine: false, note: 'Mod-local convention; not an engine callback.' },
];

const crownType: ModEventInfo[] = [
	...common,
	{ name: 'game_start', args: [], engine: true, doc: 'Runs when a run starts.' },
	{ name: 'step', args: [], engine: true, doc: 'Runs every frame while the crown is active.' },
	{ name: 'crown_name', args: [], engine: true, doc: 'Display name of the crown.' },
	{ name: 'crown_text', args: [], engine: true, doc: 'Description text.' },
	{ name: 'crown_tip', args: [], engine: true, doc: 'Tooltip text.' },
	{ name: 'crown_avail', args: [], engine: true, doc: 'Whether the crown is offered.' },
	{ name: 'crown_button', args: [], engine: true, doc: 'Crown-select button sprite.' },
	{ name: 'crown_take', args: [], engine: true, doc: 'Runs when the crown is taken.' },
	{ name: 'crown_lose', args: [], engine: true, doc: 'Runs when the crown is lost.' },
	{ name: 'crown_object', args: [], engine: true, doc: 'Object spawned for the crown.' },
	{ name: 'crown_loadout', args: [], engine: false, note: 'Mod-local convention; not an engine callback.' },
	{ name: 'crown_menu_avail', args: [], engine: false, note: 'Mod-local convention; not an engine callback.' },
	{ name: 'crown_menu_button', args: [], engine: false, note: 'Mod-local convention; not an engine callback.' },
	{ name: 'crown_locked_text', args: [], engine: false, note: 'Mod-local convention; not an engine callback.' },
	{ name: 'crown_impact', args: [], engine: false, note: 'Mod-local convention; not an engine callback.' },
	{ name: 'crown_sound', args: [], engine: false, note: 'Mod-local convention; not an engine callback.' },
	{ name: 'crown_unlock', args: [], engine: false, note: 'Mod-local convention; not an engine callback.' },
];

const areaType: ModEventInfo[] = [
	...common,
	{ name: 'area_name', args: ['subarea', 'loops'], engine: true, doc: 'Display name of the area.' },
	{ name: 'area_secret', args: [], engine: true, doc: 'Whether the area is a secret area.' },
	{ name: 'area_sprite', args: ['sprite'], engine: true, doc: 'Tileset / prop sprite override.' },
	{
		name: 'area_mapdata',
		args: ['lastx', 'lasty', 'lastarea', 'lastsubarea', 'subarea', 'loops'],
		engine: true,
		doc: 'Supplies the world-map entry for the area.',
	},
	{ name: 'area_setup', args: [], engine: true, doc: 'Runs before the level is generated.' },
	{ name: 'area_make_floor', args: [], engine: true, doc: 'Generates the floor layout.' },
	{ name: 'area_pop_enemies', args: [], engine: true, doc: 'Populates enemies.' },
	{ name: 'area_pop_props', args: [], engine: true, doc: 'Populates props.' },
	{ name: 'area_pop_chests', args: [], engine: true, doc: 'Populates chests.' },
	{ name: 'area_pop_extras', args: [], engine: true, doc: 'Populates everything else.' },
	{ name: 'area_start', args: [], engine: true, doc: 'Runs when the level starts.' },
	{ name: 'area_finish', args: [], engine: true, doc: 'Runs when the level is cleared.' },
	{ name: 'area_transit', args: [], engine: true, doc: 'Runs during the transition into the area.' },
	{ name: 'area_set_music', args: [], engine: true, doc: 'Sets the area music (100.007).' },
	{ name: 'area_text', args: [], engine: true, doc: 'Area subtitle text. Confirmed in the game binary.' },
	{ name: 'area_subarea', args: [], engine: false, note: 'NTTE convention; absent from the game binary.' },
	{ name: 'area_next', args: [], engine: false, note: 'NTTE convention; absent from the game binary.' },
	{ name: 'area_goal', args: [], engine: false, note: 'NTTE convention; absent from the game binary.' },
	{ name: 'area_music', args: [], engine: false, note: 'NTTE convention; absent from the game binary.' },
	{ name: 'area_music_boss', args: [], engine: false, note: 'NTTE convention; absent from the game binary.' },
	{ name: 'area_music_boss_intro', args: [], engine: false, note: 'NTTE convention; absent from the game binary.' },
	{ name: 'area_ambient', args: [], engine: false, note: 'NTTE convention; absent from the game binary.' },
	{ name: 'area_effect', args: [], engine: false, note: 'NTTE convention; absent from the game binary.' },
	{ name: 'area_darkness', args: [], engine: false, note: 'NTTE convention; absent from the game binary.' },
	{ name: 'area_fog', args: [], engine: false, note: 'NTTE convention; absent from the game binary.' },
	{ name: 'area_underwater', args: [], engine: false, note: 'NTTE convention; absent from the game binary.' },
	{ name: 'area_shadow_color', args: [], engine: false, note: 'NTTE convention; absent from the game binary.' },
	{ name: 'area_background_color', args: [], engine: false, note: 'NTTE convention; absent from the game binary.' },
	{ name: 'area_setup_floor', args: [], engine: false, note: 'NTTE convention; absent from the game binary.' },
	{ name: 'area_setup_spiral', args: [], engine: false, note: 'NTTE convention; absent from the game binary.' },
];

export const modEvents: { [T in ModType]: ModEventInfo[] } = {
	mod: modType,
	wep: wepType,
	race: raceType,
	skin: skinType,
	skill: skillType,
	crown: crownType,
	area: areaType,
};

export const modTypes: ModType[] = ['mod', 'wep', 'race', 'skin', 'skill', 'crown', 'area'];

/**
 * Mod type from a file name's middle extension: `name.<type>.gml`,
 * `name.<type>.ntgml` or `name.<type>.gmlbc` (NTGML-SPEC.md §8).
 * `.weapon` is accepted as an alias for `.wep`: the loader rejects it, but the
 * docs use it and it costs nothing to complete.
 */
export function modTypeFromFileName(fileName: string): ModType | null {
	const parts = fileName.toLowerCase().split('.');
	if (parts.length < 3) { return null; }
	const middle = parts[parts.length - 2];
	if (middle === 'weapon') { return 'wep'; }
	return (modTypes as string[]).indexOf(middle) >= 0 ? (middle as ModType) : null;
}

/** All reserved events for a mod type, including `init` and `cleanup`. */
export function eventsFor(type: ModType): ModEventInfo[] {
	return modEvents[type];
}
