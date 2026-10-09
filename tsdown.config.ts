import { defineConfig, type UserConfig } from "tsdown";

const config: UserConfig = defineConfig({
	entry: ["./src/Diff.ts"],
	format: ["esm"],
	target: ["es2025", "baseline-widely-available"],
	platform: "neutral",
	globalName: "HtmlDiff",
	treeshake: true,
	dts: true,
	exports: true,
});

export default config;
