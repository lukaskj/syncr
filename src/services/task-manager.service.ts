/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { Manager } from "@listr2/manager";
import { LoggerFormat, PRESET_TIMER, color } from "listr2";
import { ClientChannel } from "ssh2";
import { Service } from "typedi";
import { Scenario } from "../schemas/scenario/scenario.schema";
import { Task } from "../schemas/scenario/task.schema";
import { Servers } from "../schemas/servers-file.schema";
import { SshClient } from "../ssh-client";
import { escapePath, isNullOrUndefined, taskIsCommand, taskIsScript, taskIsUploadFile } from "../utils";
import { ServerService } from "./server.service";

const OUTPUT_BAR = 20;

const DefaultRenderOptions = {
  outputBar: OUTPUT_BAR,
  indentation: 2,
  collapseErrors: false,
  collapseSubtasks: false,
  showErrorMessage: true,
  showSubtasks: true,
  showSkipMessage: true,
  collapseSkips: false,
  persistentOutput: true,
};

@Service()
export class TaskManager {
  private manager: Manager<unknown, "default", "simple">;

  constructor(private serverService: ServerService) {
    this.manager = new Manager({
      concurrent: false,
      exitOnError: false,
      renderer: "default",
      fallbackRenderer: "simple",
      rendererOptions: {
        ...DefaultRenderOptions,
        timer: {
          ...PRESET_TIMER,
          condition: (duration): boolean => duration > 100,
          format: (_duration): LoggerFormat => {
            return (a) => color.blue(a ?? "");
          },
        },
      },
    });
  }

  public addScenario(scenario: Scenario, serversHostGroups: Servers): void {
    let hosts = Array.isArray(scenario.hosts) ? scenario.hosts : [scenario.hosts];
    if (hosts.includes("all")) {
      hosts = Object.keys(serversHostGroups);
    }

    scenario.hosts = hosts as typeof scenario.hosts; // (?)

    const listrScenarios: Parameters<typeof this.manager.add>[0] = [];

    listrScenarios.push({
      title: `Scenario: ${scenario.name}`,
      skip: scenario.disabled,
      task: (__, scenarioTask) => {
        const listrHosts: Parameters<typeof scenarioTask.newListr>[0] = [];
        for (const hostGroup of scenario.hosts) {
          const hosts = serversHostGroups[hostGroup];
          for (const host of hosts) {
            listrHosts.push({
              title: `Host: ${host.name ?? host.host} [${hostGroup}]`,
              skip: host.disabled,
              task: async (_, hostTask) => {
                const listrTasks: Parameters<typeof hostTask.newListr>[0] = [];

                for (const scenarioTask of scenario.tasks) {
                  listrTasks.push({
                    skip: scenarioTask.disabled,
                    title: scenarioTask.name,
                    exitOnError: true,
                    task: async (_ctx, _subTask) => {
                      const connection = await this.serverService.connect(host);

                      const sshStream = await this.executeTask(scenarioTask, connection);

                      if (sshStream && typeof sshStream !== "string") {
                        return new Promise((resolve, reject) => {
                          let errorString = "";
                          sshStream.on("close", (code: number, _signal: number) => {
                            _subTask.output = errorString;
                            if (!isNullOrUndefined(code) && code !== 0) {
                              console.error(errorString);

                              return reject(errorString);
                            }

                            return resolve(errorString);
                          });

                          sshStream.on("data", (data: string) => {
                            _subTask.output = data;
                          });

                          sshStream.stderr.on("data", (err) => {
                            errorString += err.toString();
                          });
                        });
                      }

                      return sshStream;
                    },
                    rendererOptions: {
                      ...DefaultRenderOptions,
                      persistentOutput: scenarioTask.logOutput,
                    },
                  });
                }

                return hostTask.newListr(listrTasks, {
                  concurrent: false,
                  exitOnError: true,

                  rendererOptions: {
                    ...DefaultRenderOptions,
                  },
                });
              },
              rendererOptions: {
                ...DefaultRenderOptions,
              },
            });
          }
        }

        return scenarioTask.newListr(listrHosts, {
          concurrent: false,
          rendererOptions: {
            ...DefaultRenderOptions,
            collapseSkips: true,
          },
        });
      },
    });

    // this.taskList.add(listrScenarios);
    this.manager.add(listrScenarios, {
      rendererOptions: {
        collapseSkips: true,
      },
    });
  }

  public async executeTask(task: Task, host: SshClient): Promise<ClientChannel | string | undefined> {
    if (taskIsCommand(task)) {
      return await host.executeRemoteCommand(task.command, task.workingDir);
    }

    if (taskIsUploadFile(task)) {
      const remoteFile = await host.uploadFile(task.uploadFile, task.workingDir, task.mode);

      return remoteFile.remoteFileLocation;
    }

    if (taskIsScript(task)) {
      const uploadResult = await host.uploadFile(task.script, task.workingDir, 0o755);

      const commandStream = await host.executeRemoteCommand(`. ${escapePath(uploadResult.remoteFileLocation)}`);

      return commandStream;
    }

    return;
  }

  public addTask(fnc: CallableFunction, title?: string, skip = false) {
    const t: Parameters<typeof this.manager.add>[0] = [
      {
        title,
        skip,
        task: async (_, _2) => {
          await fnc();
        },
        rendererOptions: {
          ...DefaultRenderOptions,
        },
      },
    ];

    this.manager.add(t);
  }

  public async runAll(): Promise<void> {
    return await this.manager.runAll({
      concurrent: false,
      exitOnError: false,
      rendererOptions: {
        ...DefaultRenderOptions,
      },
    });
  }
}
