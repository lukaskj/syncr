export function logStart(spacing: number, ...args: unknown[]): void {
  logSymbol("┌", spacing, ...args);
}

export function logEnd(spacing: number, ...args: unknown[]): void {
  logSymbol("└", spacing, ...args);
}

export function logg(spacing: number, ...args: unknown[]): void {
  logSymbol("├", spacing, ...args);
}

export function logContinue(spacing: number, ...args: unknown[]): void {
  logSymbol("│", spacing, ...args);
}

export function logSymbol(symbol: string, spacing: number, ...args: unknown[]): void {
  if (spacing > 0) {
    const spaces = `${symbol}${new Array(spacing).join("─")}`;
    console.log(spaces, ...args);
  } else {
    console.log(...args);
  }
}
