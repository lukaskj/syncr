import { dirname, resolve } from "node:path";
import { ScenarioSchema } from "./schemas/scenario/scenario.schema";
import { ServersFileSchema } from "./schemas/servers-file.schema";
import { OptsService } from "./services/opts.service";
import { ParserService } from "./services/parser.service";
import { ServerService } from "./services/server.service";
import { Injectable } from "./utils";
import { logg, loggContinue, loggEnd, loggStart } from "./utils/logger";

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
        scenario.scenarioFileBasePath = dirname(resolve(scenarioFile));

        loggStart(1, `Scenario: '${scenario.name}'`);
        if (scenario.disabled) {
          loggEnd(1, `Scenario '${scenario.name}' disabled\n`);
          continue;
        }
        loggContinue();

        let groups = Array.isArray(scenario.groups) ? scenario.groups : [scenario.groups];
        if (groups.includes("all")) {
          groups = Object.keys(serversGroups);
        }

        for (const group of groups) {
          // logg(2, `Group ${group}`);
          for (const serverConfig of serversGroups[group]) {
            if (serverConfig.disabled) {
              logg(2, `Server '${serverConfig.name ?? serverConfig.host}' disabled`);
              loggContinue();
              continue;
            }

            logg(2, `Server '${serverConfig.name ?? serverConfig.host}'`);

            const client = await this.serverService.connect(serverConfig);

            for (const task of scenario.tasks) {
              if (task.disabled) {
                logg(3, `Task '${task.name}' disabled`);
                continue;
              }

              logg(3, `Task: '${task.name}' | Server: '${client.name}'`);
              try {
                await client.executeTask(task, scenario.scenarioFileBasePath);
              } catch (error) {
                console.error(error);
                logg(3, `Error - Task: '${task.name}' | Server: '${client.name}'`);
                logg(2, `Stopped running tasks for server: '${client.name}'`);
                loggContinue();
                break;
              }
            }
          }
        }

        loggEnd(1, `Finished scenario: '${scenario.name}'`);
        console.log();
      }
    }

    loggStart(1, "Closing all connections...");
    this.serverService.disconnectAll();
    loggEnd(1, "Done!");
  }
}
