/**
 * Keywords, built-in constants, preprocessor directives and pragmas.
 *
 * Hand-maintained from `NTGML-SPEC.md` §2.5-§2.8. `dialect: 'modern'` means
 * the word is only accepted in `.ntgml` / `#pragma gml 2` files.
 *
 * `self other noone all global` are listed by the binary's keyword map but are
 * used as values, so they live in `builtinConstants` below rather than being
 * duplicated here.
 */

import { KeywordInfo, PragmaInfo } from './types';

export const keywords: KeywordInfo[] = [
	{ name: 'var', dialect: 'both', doc: 'Declares a local variable.' },
	{ name: 'globalvar', dialect: 'both', doc: 'Declares a global variable (legacy GML idiom).' },
	{ name: 'local', dialect: 'both', doc: 'Legacy alias for `var`.' },
	{ name: 'enum', dialect: 'both', doc: 'Declares an enumeration.' },
	{ name: 'if', dialect: 'both' },
	{ name: 'then', dialect: 'both', doc: 'Optional filler after an `if` condition.' },
	{ name: 'else', dialect: 'both' },
	{ name: 'begin', dialect: 'both', doc: 'Block opener; equivalent to `{`.' },
	{ name: 'end', dialect: 'both', doc: 'Block closer; equivalent to `}`.' },
	{ name: 'for', dialect: 'both' },
	{ name: 'while', dialect: 'both' },
	{ name: 'do', dialect: 'both', doc: 'Starts a `do ... until` loop.' },
	{ name: 'until', dialect: 'both', doc: 'Ends a `do ... until` loop.' },
	{ name: 'repeat', dialect: 'both', doc: 'Repeats a statement a fixed number of times.' },
	{ name: 'switch', dialect: 'both' },
	{ name: 'case', dialect: 'both' },
	{ name: 'default', dialect: 'both' },
	{ name: 'break', dialect: 'both' },
	{ name: 'continue', dialect: 'both' },
	{ name: 'with', dialect: 'both', doc: 'Runs a statement for each matching instance.' },
	{ name: 'exit', dialect: 'both', doc: 'Returns from the current script.' },
	{ name: 'return', dialect: 'both' },
	{ name: 'wait', dialect: 'both', doc: 'Suspends the script for N frames. Disabled by `#pragma fast`.' },
	{ name: 'in', dialect: 'both', doc: 'Membership test: `"name" in inst`.' },
	{ name: 'try', dialect: 'both' },
	{ name: 'catch', dialect: 'both' },
	{ name: 'throw', dialect: 'both' },
	{ name: 'finally', dialect: 'both', doc: 'In the binary keyword map; dialect gating unconfirmed.' },
	{ name: 'delete', dialect: 'both', doc: 'In the binary keyword map; dialect gating unconfirmed.' },
	{ name: 'function', dialect: 'modern', doc: 'Declares a function or a method value.' },
	{ name: 'new', dialect: 'modern', doc: 'Constructs an instance of a `constructor` function.' },
	{ name: 'static', dialect: 'modern' },
	{ name: 'constructor', dialect: 'modern' },
	{ name: 'mod', dialect: 'both', doc: 'Modulo operator.' },
	{ name: 'div', dialect: 'both', doc: 'Integer division operator.' },
	{ name: 'not', dialect: 'both', doc: 'Logical negation.' },
	{ name: 'and', dialect: 'both' },
	{ name: 'or', dialect: 'both' },
	{ name: 'xor', dialect: 'both' },
];

/** NTGML-SPEC.md §2.6. `null` is not `undefined`. */
export const builtinConstants: KeywordInfo[] = [
	{ name: 'self', dialect: 'both', doc: 'The current instance.' },
	{ name: 'other', dialect: 'both', doc: 'The other instance in a `with` block or collision.' },
	{ name: 'noone', dialect: 'both', doc: 'No instance (-4).' },
	{ name: 'all', dialect: 'both', doc: 'Every instance (-3).' },
	{ name: 'global', dialect: 'both', doc: 'The global scope.' },
	{ name: 'undefined', dialect: 'both' },
	{ name: 'null', dialect: 'both', doc: 'Distinct from `undefined`.' },
	{ name: 'true', dialect: 'both' },
	{ name: 'false', dialect: 'both' },
	{ name: 'pi', dialect: 'both' },
	{ name: 'infinity', dialect: 'both' },
	{ name: 'NaN', dialect: 'both' },
];

/**
 * Words the parser treats specially without them being lexer keywords
 * (NTGML-SPEC.md §2.5, §2.8). Worth completing, not worth colouring as
 * keywords.
 */
export const softKeywords: KeywordInfo[] = [
	{ name: 'fork', dialect: 'both', doc: 'Splits execution into a background copy. Disabled by `#pragma fast`.' },
	{ name: 'once', dialect: 'both', doc: 'Runs the following statement only the first time it is reached.' },
	{ name: 'region', dialect: 'both', doc: 'Parsed and ignored; mods usually write `//#region`.' },
	{ name: 'endregion', dialect: 'both', doc: 'Parsed and ignored.' },
];

export const preprocessorDirectives: KeywordInfo[] = [
	{ name: '#define', dialect: 'both', doc: 'Declares a script. `#define name(a, b)` gives it named arguments.' },
	{ name: '#macro', dialect: 'both', doc: 'Declares a macro. Continue over lines with a trailing `\`.' },
	{ name: '#pragma', dialect: 'both', doc: 'Compiler / loader directive.' },
	{ name: '#region', dialect: 'both', doc: 'Fold region opener.' },
	{ name: '#endregion', dialect: 'both', doc: 'Fold region closer.' },
];

/** The complete pragma set (NTGML-SPEC.md §2.8). Anything else is an error. */
export const pragmas: PragmaInfo[] = [
	{ name: 'gml', scope: 'file', arg: 'version', doc: 'Selects the dialect: `#pragma gml 2` (binary accepts 14, 20, 23).' },
	{ name: 'init', scope: 'file', doc: 'Loader-side directive; undocumented.' },
	{ name: 'include', scope: 'file', arg: 'path', doc: 'Includes another file, relative to this one.' },
	{ name: 'preload', scope: 'file', arg: 'file', doc: 'Preloads an asset file, relative to the containing file.' },
	{ name: 'using', scope: 'file', arg: 'mod.type[.ext]', doc: 'Imports another mod\'s scripts (100.001).' },
	{ name: 'fast_file', scope: 'file', doc: 'Applies `#pragma fast` to the whole file (100.023).' },
	{ name: 'fast', scope: 'statement', doc: 'Disables `wait`/`fork` in this function for speed (100.004).' },
	{ name: 'not_fast', scope: 'statement', doc: 'Cancels `fast_file` for this function (100.023).' },
	{ name: 'no_using', scope: 'statement', doc: 'Ignores `#pragma using` imports in this function (100.023).' },
];

export const keywordNames: string[] = keywords.map((k) => k.name);
export const constantNames: string[] = builtinConstants.map((k) => k.name);
export const pragmaNames: string[] = pragmas.map((p) => p.name);
