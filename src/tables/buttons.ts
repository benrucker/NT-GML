/**
 * Button names accepted by `button_pressed`, `button_check`, `button_released`
 * and friends. Hand-maintained from `NTGML-SPEC.md` §8.3, worded from
 * `api/ntt-docs/scripting/NTT-Input.dmd:14-30`. Default bindings are left out:
 * they are remappable, so what the button does is the useful part.
 */

export interface ButtonInfo {
	name: string;
	doc: string;
}

export const buttons: ButtonInfo[] = [
	{ name: 'nort', doc: 'Move up.' },
	{ name: 'sout', doc: 'Move down.' },
	{ name: 'west', doc: 'Move left.' },
	{ name: 'east', doc: 'Move right.' },
	{ name: 'fire', doc: 'Fire the held weapon.' },
	{ name: 'spec', doc: 'Use the active/special ability.' },
	{ name: 'swap', doc: 'Swap weapons.' },
	{ name: 'prev', doc: 'Mouse wheel up.' },
	{ name: 'next', doc: 'Mouse wheel down.' },
	{ name: 'pick', doc: 'Pick up weapons.' },
	{ name: 'paus', doc: 'Pause.' },
	{ name: 'okay', doc: 'Confirm.' },
	{ name: 'exit', doc: 'Close menus.' },
	{ name: 'horn', doc: 'Airhorn[.wav].' },
	{ name: 'talk', doc: 'Not an actual button: returns whether the player has chat open.' },
	// `key1` .. `key9`, `key0`: pick the N-th mutation. The first six are also
	// used for emotes in multiplayer (NTT-Input.dmd:29-30).
	{ name: 'key1', doc: 'Pick the 1st mutation; also an emote in multiplayer.' },
	{ name: 'key2', doc: 'Pick the 2nd mutation; also an emote in multiplayer.' },
	{ name: 'key3', doc: 'Pick the 3rd mutation; also an emote in multiplayer.' },
	{ name: 'key4', doc: 'Pick the 4th mutation; also an emote in multiplayer.' },
	{ name: 'key5', doc: 'Pick the 5th mutation; also an emote in multiplayer.' },
	{ name: 'key6', doc: 'Pick the 6th mutation; also an emote in multiplayer.' },
	{ name: 'key7', doc: 'Pick the 7th mutation.' },
	{ name: 'key8', doc: 'Pick the 8th mutation.' },
	{ name: 'key9', doc: 'Pick the 9th mutation.' },
	{ name: 'key0', doc: 'Pick the 10th mutation.' },
];

export const buttonNames: string[] = buttons.map((b) => b.name);
