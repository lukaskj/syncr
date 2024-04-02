import Bun from "bun";

async function build() {
  const result = await Bun.build({
    entrypoints: ["./src/index.ts"],
    target: "node",
    compile: true,
    outdir: "./dist",
    naming: "index.mjs",
    loader: {
      ".node": "file"
    }
  });

  if (!result.success) {
    console.log(result.logs);
  }
}

build();
