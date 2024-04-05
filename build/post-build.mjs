import { join } from "node:path";
import { copyFileSync, createReadStream, createWriteStream, readFileSync, unlinkSync } from "node:fs";
import { Transform } from "node:stream";

function postBuildScript(outputFile) {
  const tempFile = join("dist", "index.mjs.temp");
  const read = createReadStream(outputFile);
  const write = createWriteStream(tempFile);

  write.on("close", () => {
    unlinkSync(outputFile);
    copyFileSync(tempFile, outputFile);
    unlinkSync(tempFile);
  });

  // Add node shebang
  write.write("#!/usr/bin/env node\n");
  read.pipe(Transform.from(fixVersion)).pipe(write);
}

async function* fixVersion(source) {
  const KEY = "{{#.#.#}}";
  const packageJsonFile = readFileSync("./package.json").toString();
  const packageJson = JSON.parse(packageJsonFile);
  const version = packageJson.version;
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

export { postBuildScript };
