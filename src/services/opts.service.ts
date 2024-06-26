import { Command } from "commander";
import { Service } from "typedi";
import { TOptions } from "./types";

@Service()
export class OptsService {
  public opts: TOptions;
  private program: Command;

  constructor() {
    this.opts = {
      debug: false,
      serversFile: "",
      hosts: [],
      scenarios: [],
      verbose: false,
    };

    this.program = new Command();
  }

  public async handleArgs(): Promise<TOptions> {
    await this.program
      .name("syncr")
      .description("Automation tool to help configure and orchestrate remotely via ssh using configuration files.")
      .argument("<scenarios...>", "Scenarios to sync")
      .option("-s, --serversFile <file>", "Servers file", "servers.yaml")
      .option("-h, --hosts <hosts>", "Run only in specified comma-separated hosts groups", (value: string) => {
        if (value && typeof value === "string") return value.trim().split(",");
        return undefined;
      })
      .option("-d, --debug", "Debug mode", false)
      .option("-v, --verbose", "Verbose", false)
      .version("{{#.#.#}}")
      .parseAsync();

    const options = this.program.opts<TOptions>();
    options.scenarios = this.program.processedArgs[0];

    this.opts = options;

    return options;
  }
}
