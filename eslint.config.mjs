// ESLint flat config. Replaces the old tslint.json; the explicit rules below
// are the ones that file enforced (curly, triple-equals, no-string-throw),
// the rest comes from the recommended presets.
import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig(
	globalIgnores(['out/', 'node_modules/', '.vscode-test/', '*.vsix']),
	js.configs.recommended,
	tseslint.configs.recommended,
	{
		files: ['**/*.ts'],
		rules: {
			curly: 'error',
			eqeqeq: ['error', 'always'],
			'no-throw-literal': 'error',
			'@typescript-eslint/no-unused-vars': [
				'error',
				{ argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
			],
		},
	},
);
