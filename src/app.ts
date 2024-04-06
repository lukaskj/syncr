import { ServersFileSchema } from "./schemas/servers-file.schema";
import { OptsService } from "./services/opts.service";
import { ParserService } from "./services/parser.service";
import { ScenarioValidationService } from "./services/scenario-validation.service";
import { ServerService } from "./services/server.service";
import { TaskManager } from "./services/task-manager.service";
import { Injectable } from "./utils";

@Injectable()
export class App {
  constructor(
    private optsService: OptsService,
    private serverService: ServerService,
    private parser: ParserService,
    private scenarioValidationService: ScenarioValidationService,
    private taskManager: TaskManager,
  ) {}

  public async start(): Promise<void> {
    const options = await this.optsService.handleArgs();

    const serversHostGroups = await this.parser.parseFile(options.serversFile, ServersFileSchema);

    const scenarios = await this.parser.parseScenariosFiles(options.scenarios);

    this.scenarioValidationService.validateAll(scenarios, serversHostGroups);

    for (const scenario of scenarios) {
      this.taskManager.addScenario(scenario, serversHostGroups);
    }

    this.taskManager.addTask(this.serverService.disconnectAll.bind(this.serverService), "Disconnecting...");

    try {
      await this.taskManager.runAll();
    } catch (error) {
      // console.trace(error);
      this.serverService.disconnectAll();
    }
  }
}
