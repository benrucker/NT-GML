/**
 * Signature help for the call the cursor sits in. No `vscode` import.
 */

import { functionByName } from '../generated/functions';
import { CallContext, findCall } from './context';
import { argDocumentation, renderSignatureParts, signatureDocumentation } from './format';
import { ParameterData, SignatureData } from './model';

/**
 * Signature data for one call, or `undefined` when the name is not an NTT
 * function.
 *
 * `activeParameter` is the comma count at the call's own depth, clamped to the
 * last parameter. Clamping unconditionally keeps the signature usable when a
 * trailing comma or an extra argument has been typed - VS Code hides the
 * highlight entirely for an out-of-range index - and on a trailing rest
 * argument it means `...values` stays highlighted however many values follow.
 */
export function signatureFor(call: CallContext): SignatureData | undefined {
	const fn = functionByName(call.name);
	if (fn === undefined) { return undefined; }
	const { label, ranges } = renderSignatureParts(fn);
	const parameters: ParameterData[] = fn.args.map((a, i): ParameterData => ({
		label: ranges[i],
		documentation: argDocumentation(a),
	}));
	return {
		label,
		documentation: signatureDocumentation(fn),
		parameters,
		activeParameter: Math.min(call.argIndex, Math.max(0, fn.args.length - 1)),
	};
}

/**
 * Signature data for the innermost call before the cursor. `text` is the
 * document text up to the cursor (or as much of it as the caller has); a call
 * whose arguments run over several lines is found as long as its `(` is inside
 * the context window.
 */
export function signatureAt(text: string): SignatureData | undefined {
	const call = findCall(text);
	return call === undefined ? undefined : signatureFor(call);
}
