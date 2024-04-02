import Bun from "bun";

async function build() {
  const result = await Bun.build({
    entrypoints: ["./src/index.ts"],
    target: "node",
    compile: true,
    outdir: "./dist",
    naming: "index.mjs",
  });

  console.log("result", result.success);
}

build();
