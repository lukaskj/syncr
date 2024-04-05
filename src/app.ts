import { ServersFileSchema } from "./schemas/servers-file.schema";
import { OptsService } from "./services/opts.service";
import { ParserService } from "./services/parser.service";
import { ScenarioValidationService } from "./services/scenario-validation.service";
import { ServerService } from "./services/server.service";
import { Injectable } from "./utils";
import { logg, loggContinue, loggEnd, loggStart } from "./utils/logger-simple";

@Injectable()
export class App {
  constructor(
    private optsService: OptsService,
    private serverService: ServerService,
    private parser: ParserService,
    private scenarioValidationService: ScenarioValidationService,
  ) {}
  public async start(): Promise<void> {
    const options = await this.optsService.handleArgs();

    const serversHostGroups = await this.parser.parseFile(options.serversFile, ServersFileSchema);

    const scenarios = await this.parser.parseScenariosFiles(options.scenarios);

    await this.scenarioValidationService.validateAll(scenarios, serversHostGroups);

    for (const scenario of scenarios) {
      loggStart(1, `Scenario: '${scenario.name}'`);
      if (scenario.disabled) {
        loggEnd(1, `Scenario '${scenario.name}' disabled\n`);
        continue;
      }
      loggContinue();

      let hosts = Array.isArray(scenario.hosts) ? scenario.hosts : [scenario.hosts];
      if (hosts.includes("all")) {
        hosts = Object.keys(serversHostGroups);
      }

      for (const host of hosts) {
        // logg(2, `Host ${host}`);
        for (const serverConfig of serversHostGroups[host]) {
          if (serverConfig.disabled) {
            logg(2, `Server '${serverConfig.name ?? serverConfig.host}' disabled`);
            loggContinue();
            continue;
          }

          logg(2, `Server '${serverConfig.name ?? serverConfig.host}'`);

          const client = await this.serverService.connect(serverConfig);

          for (const key in scenario.tasks) {
            const task = scenario.tasks[key];
            if (task.disabled) {
              logg(3, `Task '${task.name}' disabled`);
              continue;
            }

            logg(3, `Task: '${task.name}' | Server: '${client.name}'`);
            try {
              await client.executeTask(task);
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

    loggStart(1, "Closing all connections...");
    this.serverService.disconnectAll();
    loggEnd(1, "Done!");
  }
}
