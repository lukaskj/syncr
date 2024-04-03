const { join } = require("node:path");
const { createReadStream, createWriteStream, unlinkSync } = require("node:fs");
const { Transform } = require("node:stream");

function postBuildScript(outputFile) {
  const distFile = join("dist", "index.mjs");
  const read = createReadStream(outputFile);
  const write = createWriteStream(distFile);

  write.on("close", () => {
    unlinkSync(outputFile);
  });

  // Add node shebang
  write.write("#!/usr/bin/env node\n");
  read.pipe(Transform.from(fixVersion)).pipe(write);
}

async function* fixVersion(source) {
  const KEY = "{{#.#.#}}";
  const version = require("../package.json").version;
  let found = false;

  for await (const _chunk of source) {
    const chunk = _chunk.toString();
    if (!found && chunk.indexOf(KEY) >= 0) {
      found = true;
      yield chunk.replace(KEY, version ?? "0.0.0");
    } else {
      yield chunk;
    }
  }
}

module.exports = { postBuildScript };
