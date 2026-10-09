import { defineConfig, OxfmtConfig } from "oxfmt";

const config: OxfmtConfig = defineConfig({
	useTabs: true,
	tabWidth: 4,
	printWidth: 120,
	endOfLine: "crlf",
	semi: true,
	sortImports: {
		newlinesBetween: false,
	},
	insertFinalNewline: true,
});

export default config;
