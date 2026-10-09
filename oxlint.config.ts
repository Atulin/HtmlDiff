import { defineConfig, OxlintConfig } from "oxlint";
const config: OxlintConfig = defineConfig({
	plugins: ["typescript", "unicorn", "oxc", "promise", "import"],
	categories: {
		correctness: "error",
		suspicious: "warn",
	},
	rules: {
		"no-param-reassign": "error",
		"default-param-last": "error",
		"no-else-return": "error",
		"require-await": "error",
		"prefer-regex-literals": "warn",
		"typescript/prefer-as-const": "error",
		"typescript/no-inferrable-types": "off",
		"typescript/prefer-enum-initializers": "off",
		"unicorn/prefer-number-properties": "error",
		curly: "warn",
	},
	options: {
		typeAware: true,
		typeCheck: true,
	},
	env: {
		builtin: true,
	},
});

export default config;
