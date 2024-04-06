/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { Manager } from "@listr2/manager";
import { ListrErrorTypes, LoggerFormat, PRESET_TIMER, color } from "listr2";
import { ClientChannel } from "ssh2";
import { Service } from "typedi";
import { Scenario } from "../schemas/scenario/scenario.schema";
import { CommandTask, Task, UploadFileTask } from "../schemas/scenario/task.schema";
import { Servers } from "../schemas/servers-file.schema";
import { SshClient } from "../ssh-client";
import { isNullOrEmptyOrUndefined, isNullOrUndefined, taskIsCommand, taskIsScript, taskIsUploadFile } from "../utils";
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
      // enabled: !scenario.disabled,
      skip: scenario.disabled,
      task: (__, __task) => {
        const listrHosts: Parameters<typeof __task.newListr>[0] = [];
        for (const hostGroup of scenario.hosts) {
          const hosts = serversHostGroups[hostGroup];
          for (const host of hosts) {
            listrHosts.push({
              title: `Host: ${host.name ?? host.host}`,
              skip: host.disabled,
              task: async (_, _task) => {
                const listrTasks: Parameters<typeof _task.newListr>[0] = [];

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
                              return reject(errorString);
                            } else {
                              if (!isNullOrEmptyOrUndefined(errorString)) {
                                _subTask.report(new Error(errorString), ListrErrorTypes.HAS_FAILED);
                              }
                              return resolve(errorString);
                            }
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
                      persistentOutput: true,
                    },
                  });
                }

                return _task.newListr(listrTasks, {
                  exitOnError: true,
                  collectErrors: "full",
                  rendererOptions: {
                    clearOutput: false,
                    showErrorMessage: true,
                    collapseErrors: false,
                    collapseSkips: false,
                    collapseSubtasks: false,
                    showSkipMessage: true,
                    showSubtasks: true,
                  },
                });
              },
              rendererOptions: {
                persistentOutput: true,
                outputBar: OUTPUT_BAR,
              },
            });
          }
        }

        return __task.newListr(listrHosts, {
          rendererOptions: {
            ...DefaultRenderOptions,
          },
        });
      },
    });

    // this.taskList.add(listrScenarios);
    this.manager.add(listrScenarios);
  }

  public async executeTask(task: Task, host: SshClient): Promise<ClientChannel | string | undefined> {
    if (taskIsCommand(task)) {
      return await host.executeRemoteCommand(task);
    }

    if (taskIsUploadFile(task)) {
      return await host.uploadFile(task);
    }

    if (taskIsScript(task)) {
      const scriptTask: UploadFileTask = {
        ...task,
        uploadFile: task.script,
        mode: 0o755,
      };

      const remoteFileLocation = await host.uploadFile(scriptTask);
      const newCommandTask: CommandTask = {
        ...task,
        command: remoteFileLocation,
      };

      const commandStream = await host.executeRemoteCommand(newCommandTask);
      if (typeof commandStream === "string") {
        await host.deleteRemoteFile(remoteFileLocation);
        return commandStream;
      } else {
        commandStream.on("close", async () => {
          await host.deleteRemoteFile(remoteFileLocation);
        });

        return commandStream;
      }
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
    return await this.manager.runAll();
  }
}
