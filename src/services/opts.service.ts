import { Service } from "typedi";
import { TOptions } from "./types";
import { Command } from "commander";

@Service()
export class OptsService {
  public opts: TOptions;
  private program: Command;

  constructor() {
    this.opts = {
      debug: false,
      configFile: "",
    };

    this.program = new Command();
  }

  public async handleArgs(): Promise<TOptions> {
    await this.program
      .name("syncr")
      .description("CLI automation application to help provisioning, configuration and orchestration remotely.")
      .argument("<files...>", "Config files to sync")
      .option("-c, --configFile <file>", "Config file")
      .option("-d, --debug", "Debug mode", false)
      .parseAsync();

    const options = this.program.opts<TOptions>();

    console.log(this.program.args);

    if (options.debug) {
      console.log({ options });
    }

    return options;
  }
}
