import * as esbuild from "esbuild";
import { esbuildDecorators } from "@anatine/esbuild-decorators";
import { postBuildScript } from "./post-build.mjs";

const OUTFILE = "dist/index.mjs";

async function build() {
  await esbuild.build({
    platform: "node",
    outfile: "dist/index.mjs",
    entryPoints: ["src/index.ts"],
    bundle: true,
    treeShaking: true,
    minify: false,
    format: "esm",
    target: "es2020",
    // sourcemap: "inline",
    keepNames: true,
    logLevel: "info",
    loader: {
      ".node": "file",
    },
    inject: ["./build/cjs-shim.ts"],
    plugins: [esbuildDecorators()],
  });
}

await build();
postBuildScript(OUTFILE);
