import { ServersFileSchema } from "./schemas/servers-file.schema";
import { OptsService } from "./services/opts.service";
import { ParserService } from "./services/parser.service";
import { ReportService } from "./services/report-service";
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
    private reportService: ReportService,
  ) {}

  public async start(): Promise<void> {
    this.registerGracefulShutdown();

    const options = await this.optsService.handleArgs();

    const serversHostGroups = await this.parser.parseFile(options.serversFile, ServersFileSchema);

    const scenarios = await this.parser.parseScenariosFiles(options.scenarios);

    this.scenarioValidationService.validateAll(scenarios, serversHostGroups);

    for (const scenario of scenarios) {
      this.taskManager.addScenario(scenario, serversHostGroups);
    }

    try {
      const results = await this.taskManager.runAll();
      this.reportService.logTaskRunResults(results);
    } finally {
      this.serverService.disconnectAll();
    }
  }

  private registerGracefulShutdown(): void {
    ["SIGINT", "SIGTERM", "SIGBREAK"].forEach((signal) => {
      process.on(signal, async () => {
        this.serverService.disconnectAll();
        process.exit(0);
      });
    });
  }
}
