import { ScenarioSchema } from "./schemas/scenario/scenario.schema";
import { ServersFileSchema } from "./schemas/servers-file.schema";
import { OptsService } from "./services/opts.service";
import { ParserService } from "./services/parser.service";
import { Injectable } from "./utils";

@Injectable()
export class App {
  constructor(
    private optsService: OptsService,
    private parser: ParserService,
  ) {}
  public async start(): Promise<void> {
    const options = await this.optsService.handleArgs();
    console.log({ options });

    const serversConfiguration = await this.parser.parseFile(options.serversFile, ServersFileSchema);
    console.log({ serversConfiguration });

    for (const scenarioFile of options.scenarios) {
      const scenario = await this.parser.parseFile(scenarioFile, ScenarioSchema);
      console.log({ scenario });
    }
  }
}
