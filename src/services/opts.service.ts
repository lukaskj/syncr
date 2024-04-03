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
      scenarios: [],
      verbose: false,
    };

    this.program = new Command();
  }

  public async handleArgs(): Promise<TOptions> {
    await this.program
      .name("syncr")
      .description("CLI automation application to help provisioning, configuration and orchestration remotely.")
      .argument("<scenarios...>", "Scenarios to sync")
      .option("-s, --serversFile <file>", "Servers file", "servers.yaml")
      .option("-d, --debug", "Debug mode", false)
      .version("{{#.#.#}}")
      .parseAsync();

    const options = this.program.opts<TOptions>();
    options.scenarios = this.program.processedArgs[0];

    if (options.debug) {
      console.log({ options });
    }

    this.opts = options;

    return options;
  }
}
