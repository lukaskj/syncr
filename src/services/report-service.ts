import chalk from "chalk";
import { Service } from "typedi";
import { Ctx } from "./types.js";

function createErrorLog(errorInstance: Error): string[] {
  if (!errorInstance.stack) {
    return [errorInstance.name?.trim(), errorInstance.message?.trim()];
  }

  const [name, ...rest] = errorInstance.stack.split("\n");
  return [chalk.underline(name.trim()), chalk.grey(rest.map((l) => l.replace(/^/, "\n")).join(""))];
}

@Service()
export class ReportService {
  public logTaskRunResults(result: Ctx): void {
    const logs: string[] = [];

    for (const error of result.errors) {
      logs.push("");
      logs.push(chalk.red(error.scenario));
      logs.push(chalk.red(`  ${error.host}`));
      logs.push(chalk.red(`  × ${error.task}`));
      const errorInstance = error.error as Error;
      if (error.error instanceof AggregateError) {
        for (let i = 0; i < error.error.errors.length; i++) {
          const err = error.error.errors[i] as Error;
          const parsedError = createErrorLog(err);
          parsedError[0] = `${i + 1}- ` + parsedError[0];
          logs.push(...parsedError);
        }
      } else {
        logs.push("", ...createErrorLog(errorInstance));
      }
    }

    for (const warning of result.warnings) {
      logs.push("");
      logs.push(chalk.yellow(warning.scenario));
      logs.push(chalk.yellow(`  ${warning.host}`));
      logs.push(chalk.yellow(`  ‼ ${warning.task}`));
      logs.push(warning.message?.trim());
    }

    if (logs.some((line) => line.trim().length)) {
      for (const line of logs) {
        console.log(line);
      }
    }

    // console.log("Errors", result.errors);
    // console.log("Warnings", result.warnings);
  }
}
