import { copyFile, readFile, unlink, writeFile } from "node:fs/promises";

const isBack = process.argv[2] === "back";
const BACKUP_FILE = "package.json.bkp";

async function removePackageJsonDependencies(isBack) {
  if (!isBack) {
    await copyFile("package.json", BACKUP_FILE);
    const contents = JSON.parse(await readFile("package.json"));
    delete contents.dependencies;
    delete contents.devDependencies;
    await writeFile("package.json", JSON.stringify(contents, null, 2));
  } else {
    await copyFile(BACKUP_FILE, "package.json");
    await unlink(BACKUP_FILE);
  }
}

removePackageJsonDependencies(isBack);
