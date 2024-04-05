import { existsSync } from "node:fs";
import { isAbsolute, resolve } from "node:path";
import { Service } from "typedi";
import { Scenario } from "../schemas/scenario/scenario.schema";
import { Task } from "../schemas/scenario/task.schema";
import { Servers } from "../schemas/servers-file.schema";
import { taskIsScript, taskIsUploadFile } from "../utils/task-check";

@Service()
export class ScenarioValidationService {
  public validate(scenario: Scenario): void {
    for (const task of scenario.tasks) {
      this.checkIfFileExists(task, scenario);
    }
  }

  public validateAll(scenarios: Scenario[], servers: Servers): void {
    for (const scenario of scenarios) {
      this.validate(scenario);
      this.validateScenarioGroups(scenario, servers);
    }
  }

  public validateScenarioGroups(scenario: Scenario, servers: Servers): void {
    for (let i = 0; i < scenario.groups.length; i++) {
      const group = scenario.groups[i];
      if (group === "all") continue;
      if (!(group in servers)) {
        throw new Error(
          `Validation error: Group '${group}' not found in servers config file. Path: scenario."${scenario.name}".groups[${i}].`,
        );
      }
    }
  }

  private checkIfFileExists(task: Task, scenario: Scenario): void {
    let localFile = "";
    if (taskIsScript(task)) {
      localFile = task.script;
    } else if (taskIsUploadFile(task)) {
      localFile = task.uploadFile;
    } else {
      return;
    }

    let localFilePathRelativeToScenarioFile = localFile;

    if (!isAbsolute(localFile)) {
      localFilePathRelativeToScenarioFile = resolve(scenario.scenarioFileBasePath, localFile);
    }

    if (!existsSync(localFilePathRelativeToScenarioFile)) {
      throw new Error(
        `Validation error: File not found in scenario."${scenario.name}".task."${task.name}". Path '${localFilePathRelativeToScenarioFile}'.`,
      );
    }

    if (taskIsScript(task)) {
      task.script = localFilePathRelativeToScenarioFile;
    } else if (taskIsUploadFile(task)) {
      task.uploadFile = localFilePathRelativeToScenarioFile;
    }
  }
}
