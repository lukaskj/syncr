import * as esbuild from "esbuild";
import { esbuildDecorators } from "@anatine/esbuild-decorators";

const sharedConfig = {};

await esbuild.build({
  ...sharedConfig,
  platform: "node",
  outfile: "dist/index.js",
  entryPoints: ["src/index.ts"],
  // outfile: "dist/index.mjs",
  bundle: true,
  treeShaking: true,
  minify: false,
  // platform: "node",
  format: "esm",
  // target: "esnext",
  sourcemap: true,
  keepNames: true,
  logLevel: "info",
  plugins: [esbuildDecorators()],
});
