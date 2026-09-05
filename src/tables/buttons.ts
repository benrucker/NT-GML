/**
 * Button names accepted by `button_pressed`, `button_check`, `button_released`
 * and friends. Hand-maintained from `NTGML-SPEC.md` §8.3.
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
	{ name: 'prev', doc: 'Previous menu entry.' },
	{ name: 'next', doc: 'Next menu entry.' },
	{ name: 'pick', doc: 'Pick up / interact.' },
	{ name: 'paus', doc: 'Pause.' },
	{ name: 'okay', doc: 'Confirm.' },
	{ name: 'exit', doc: 'Cancel / back.' },
	{ name: 'horn', doc: 'Horn (co-op ping).' },
	{ name: 'talk', doc: 'Open chat.' },
	{ name: 'key1', doc: 'Number key 1.' },
	{ name: 'key2', doc: 'Number key 2.' },
	{ name: 'key3', doc: 'Number key 3.' },
	{ name: 'key4', doc: 'Number key 4.' },
	{ name: 'key5', doc: 'Number key 5.' },
	{ name: 'key6', doc: 'Number key 6.' },
	{ name: 'key7', doc: 'Number key 7.' },
	{ name: 'key8', doc: 'Number key 8.' },
	{ name: 'key9', doc: 'Number key 9.' },
	{ name: 'key0', doc: 'Number key 0.' },
];

export const buttonNames: string[] = buttons.map((b) => b.name);
