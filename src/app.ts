import { ScenarioSchema } from "./schemas/scenario/scenario.schema";
import { ServersFileSchema } from "./schemas/servers-file.schema";
import { OptsService } from "./services/opts.service";
import { ParserService } from "./services/parser.service";
import { ServerService } from "./services/server.service";
import { Injectable } from "./utils";
import { logg, loggEnd, loggStart } from "./utils/logger";

@Injectable()
export class App {
  constructor(
    private optsService: OptsService,
    private serverService: ServerService,
    private parser: ParserService,
  ) {}
  public async start(): Promise<void> {
    const options = await this.optsService.handleArgs();

    const serversGroups = await this.parser.parseFile(options.serversFile, ServersFileSchema);

    // TODO validate if all groups exists before executing anything
    for (const scenarioFile of options.scenarios) {
      const scenarios = await this.parser.parseFile(scenarioFile, ScenarioSchema);
      for (const scenario of scenarios) {
        loggStart(1, `Scenario: '${scenario.name}'`);
        if (scenario.disabled) {
          loggEnd(1, `Scenario '${scenario.name}' disabled\n`);
          continue;
        }

        const groups = Array.isArray(scenario.groups) ? scenario.groups : [scenario.groups];

        for (const group of groups) {
          logg(2, `Group ${group}`);
          for (const serverConfig of serversGroups[group]) {
            if (serverConfig.disabled) {
              logg(3, `Server '${serverConfig.name ?? serverConfig.host}' disabled`);
              continue;
            }

            const client = await this.serverService.connect(serverConfig);

            for (const task of scenario.tasks) {
              try {
                await client.executeTask(task);
              } catch (error) {
                console.error(error);
              }
            }
          }
        }

        loggEnd(1, `Finished schenario: '${scenario.name}'`);
      }
    }
    console.log();
    loggStart(1, "Closing all connections...");
    this.serverService.disconnectAll();
    loggEnd(1, "Done!");
  }
}
