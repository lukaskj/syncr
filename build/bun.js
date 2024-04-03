import Bun from "bun";
import { createReadStream, createWriteStream, unlinkSync } from "fs";
import { join } from "path";

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

  const distFile = join("dist", "index.mjs");
  const read = createReadStream(outputFile.path);
  const write = createWriteStream(distFile);

  write.on("close", () => {
    unlinkSync(outputFile.path);
  });

  write.write("#!/usr/bin/env node\n");
  read.pipe(write);
}

build();
