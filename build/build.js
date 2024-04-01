const Bun = require("bun");

async function build() {
  const result = await Bun.build({
    entrypoints: ["./src/index.ts"],
    target: "bun",
    compile: true,
    outdir: "./dist",
  });

  console.log({ result });
}

build();
