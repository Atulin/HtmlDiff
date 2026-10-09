import { defineConfig, type UserConfig } from "tsdown";

const baseConfig = {
  entry: ["./src/Diff.ts"],
  format: ["esm", "iife"],
  target: ["es2025", "baseline-widely-available"],
  platform: "neutral",
  globalName: "HtmlDiff",
  treeshake: true,
} satisfies UserConfig;

export default defineConfig([
  {
    ...baseConfig,
    dts: false,
    minify: true,
    outExtensions: () => ({js: '.min.js'})
  },
  {
    ...baseConfig,
    dts: true,
    minify: false,
    exports: true,
  },
]);
