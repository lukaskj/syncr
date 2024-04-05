import Bun from "bun";
import { postBuildScript } from "./post-build.mjs";

async function build() {
  const result = await Bun.build({
    entrypoints: ["./src/index.ts"],
    target: "node",
    outdir: "./dist",
    naming: "index.js",
    loader: {
      ".node": "file",
    },
  });

  if (!result.success) {
    console.log(result.logs);
    return;
  }

  // Add node shebang
  const outputFile = result.outputs.find((o) => o.kind === "entry-point");
  if (!outputFile) {
    throw new Error("Output file not found to add shebang.");
  }

  postBuildScript(outputFile.path);
}

build();
