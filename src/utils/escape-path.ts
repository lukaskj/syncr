export function escapePath(path: string): string {
  return path.replace(/(\s+)/g, "\\$1");
}
