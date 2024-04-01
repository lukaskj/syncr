import * as esbuild from "esbuild";

const sharedConfig = {
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
  // banner: {
  //   js: "import { createRequire } from 'module';const require = createRequire(import.meta.url);",
  // },
  // plugins: [esbuildDecorators()],
  // external: Object.keys(packageJson.default.dependencies).concat(
  //   Object.keys(packageJson.default.peerDependencies || {}),
  // ),
};

await esbuild.build({
  ...sharedConfig,
  platform: "node",
  outfile: "dist/index.js",
});

// await esbuild.build({
//   ...sharedConfig,
//   outfile: "dist/index.esm.js",
//   platform: "neutral", // for ESM
//   format: "esm",
//   banner: {
//     js: "import { createRequire } from 'module';const require = createRequire(import.meta.url);",
//   },
// });
