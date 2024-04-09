import chalk from "chalk";
import { Service } from "typedi";
import { Ctx } from "./types.js";
import { OptsService } from "./opts.service";

@Service()
export class ReportService {
  constructor(private optsService: OptsService) {}

  public logTaskRunResults(result: Ctx): void {
    const logs: string[] = [];

    for (const warning of result.warnings) {
      logs.push("");
      logs.push(chalk.yellow(warning.scenario));
      logs.push(chalk.yellow(`  ${warning.host}`));
      logs.push(chalk.yellow(`    ‼ ${warning.task}`));
      logs.push(warning.message?.trim());
    }

    for (const error of result.errors) {
      logs.push("");
      logs.push(chalk.red(error.scenario));
      logs.push(chalk.red(`  ${error.host}`));
      logs.push(chalk.red(`    × ${error.task}`));
      const errorInstance = error.error as Error;
      if (error.error instanceof AggregateError) {
        for (let i = 0; i < error.error.errors.length; i++) {
          const err = error.error.errors[i] as Error;
          const parsedError = this.createErrorLog(err);
          parsedError[0] = `${i + 1}- ` + parsedError[0];
          logs.push(...parsedError);
        }
      } else {
        logs.push(...this.createErrorLog(errorInstance));
      }
    }

    if (logs.some((line) => line.trim().length)) {
      for (const line of logs) {
        console.log(line);
      }
    }
  }

  private createErrorLog(errorInstance: Error): string[] {
    if (errorInstance.stack && this.optsService.opts.debug) {
      const [name, ...rest] = errorInstance.stack.split("\n");
      const stack = chalk.grey(rest.map((l) => l.replace(/^/, "\n")).join(""));
      return [chalk.underline(name.trim()), stack];
    }

    return [chalk.underline(errorInstance.message?.trim())];
  }
}
