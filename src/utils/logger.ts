const START_SYMBOL = "┌";
const CONTINUE_SYMBOL = "│";
const LOGG_SYMBOL = "├";
const END_SYMBOL = "└";
const SPACING_SYMBOL = "─";

export function loggStart(spacing: number, ...args: unknown[]): void {
  loggSymbol(START_SYMBOL, spacing, ...args);
}

export function loggEnd(spacing: number, ...args: unknown[]): void {
  loggSymbol(END_SYMBOL, spacing, ...args);
}

export function logg(spacing: number, ...args: unknown[]): void {
  loggSymbol(LOGG_SYMBOL, spacing, ...args);
}

export function loggContinue(spacing: number = 1, ...args: unknown[]): void {
  loggSymbol(CONTINUE_SYMBOL, spacing, ...args);
}

export function loggMultiLine(spacing: number, ...args: unknown[]): void {
  for (const arg of args) {
    if (typeof arg === "string") {
      const lines = arg.split("\n");
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (i === lines.length - 1 && !line.length) continue;
        if (line.length) {
          logg(spacing, line);
        } else {
          loggContinue(1);
        }
      }
    }
  }
}

function loggSymbol(symbol: string, spacing: number, ...args: unknown[]): void {
  if (spacing > 0) {
    const spaces = `${symbol}${new Array(spacing).join(SPACING_SYMBOL)}`;
    console.log(spaces, ...args);
  } else {
    console.log(...args);
  }
}
