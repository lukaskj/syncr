import { existsSync, readFileSync } from "fs";
import { basename, join } from "path";
import { Client } from "ssh2";
import { CommandTask, Task, UploadFileTask } from "../schemas/scenario/task.schema";
import { Server } from "../schemas/server.schema";
import { logg, loggContinue, loggMultiLine } from "../utils/logger";
import { taskIsCommand, taskIsScript, taskIsUploadFile } from "../utils/task-check";
import { isNullOrEmptyOrUndefined, isNullOrUndefined } from "../utils/is-null-or-undefined";

export class SshClient {
  public isConnected = false;
  public connection: Client;
  private params: Server;

  public get name(): string {
    return this.params.name ?? `${this.params.host}:${this.params.port}`;
  }

  constructor(
    params: Server,
    private verbose: boolean,
  ) {
    this.params = params;
    this.connection = new Client();
  }

  public async connect(): Promise<boolean> {
    const verbose = this.verbose;
    if (this.isConnected) {
      return Promise.resolve(true);
    }

    return new Promise((resolve, reject) => {
      this.connection.connect({
        host: this.params.host,
        port: this.params.port,
        username: this.params.username,
        password: this.params.password,
        privateKey: this.params.identityFile ? readFileSync(this.params.identityFile) : undefined,
        readyTimeout: this.params.timeout,
      });

      this.connection.on("ready", () => {
        if (verbose) {
          logg(1, `${this.name} connected`);
        }
        this.isConnected = true;
        resolve(true);
      });

      this.connection.on("error", (err) => {
        reject(err);
      });
    });
  }

  public async executeTask(task: Task, scenarioBaseFilePath: string): Promise<boolean> {
    const baseLogSpacing = 3;

    if (!this.isConnected) {
      logg(baseLogSpacing + 1, `[-] '${this.name}' not connected`);
      return Promise.resolve(false);
    }

    if (task.disabled) {
      loggContinue(baseLogSpacing + 1, `Task '${task.name}' disabled`);
      logg(baseLogSpacing + 1, `Done`);
      loggContinue();
      return true;
    }

    if (taskIsCommand(task)) {
      logg(baseLogSpacing + 1, `Command: '${task.command}'`);

      await this.executeRemoteCommand(task);
    } else if (taskIsScript(task)) {
      logg(baseLogSpacing + 1, `Script: '${task.script}'`);

      const scriptTask: UploadFileTask = {
        ...task,
        uploadFile: task.script,
        mode: 0o755,
      };

      const remoteFileLocation = await this.uploadFile(scriptTask, scenarioBaseFilePath);

      const newCommandTask: CommandTask = {
        ...task,
        command: remoteFileLocation,
      };

      await this.executeRemoteCommand(newCommandTask);
      await this.deleteRemoteFile(remoteFileLocation);
    } else if (taskIsUploadFile(task)) {
      logg(baseLogSpacing + 1, `Upload file: '${task.uploadFile}'`);

      await this.uploadFile(task, scenarioBaseFilePath);
    }

    logg(baseLogSpacing + 1, `Done`);
    loggContinue();

    return true;
  }

  public executeRemoteCommand(task: CommandTask): Promise<number> {
    if (!this.isConnected) {
      logg(4, `[-] '${this.name}' not connected`);
      return Promise.resolve(1);
    }

    const logOutput = task.logOutput;
    const workingDir = task.workingDir;

    const conn = this.connection;
    const showOutput = this.verbose || logOutput;

    return new Promise((resolve, reject) => {
      const commandWithWorkingDir = `cd ${workingDir} && ${task.command}`;

      conn.exec(commandWithWorkingDir, {}, (err, stream) => {
        if (err) return reject(err);

        let errorStr = "";
        stream
          .on("close", (code: number, _signal: number) => {
            if (!isNullOrUndefined(code) && code !== 0) {
              reject(errorStr);
            } else {
              if (!isNullOrEmptyOrUndefined(errorStr)) {
                console.warn("Warning:", errorStr);
              }
              resolve(code);
            }
          })
          .on("data", (data: string) => {
            if (showOutput) {
              loggMultiLine(6, data.toString());
            }
          })
          .stderr.on("data", (data) => {
            errorStr += data.toString();
          });
      });
    });
  }

  public async uploadFile(uploadFileTask: UploadFileTask, scenarioBaseFilePath: string): Promise<string> {
    const localFile: string = uploadFileTask.uploadFile;
    const serverWorkingDir = uploadFileTask.workingDir;
    const mode: number = uploadFileTask.mode;

    const localFilePathRelativeToScenarioFile = join(scenarioBaseFilePath, localFile);

    if (!existsSync(localFilePathRelativeToScenarioFile)) {
      throw new Error(`File not found at '${localFilePathRelativeToScenarioFile}'.`);
    }

    return new Promise((resolve, reject) => {
      this.connection.sftp((err, sftp) => {
        if (err) return reject(err);

        const fileName = basename(localFilePathRelativeToScenarioFile);
        const remoteFile = `${serverWorkingDir}/${fileName}`;

        sftp.fastPut(localFilePathRelativeToScenarioFile, remoteFile, (err: unknown) => {
          if (err) return reject(err);
          sftp.chmod(remoteFile, mode, (err) => {
            if (err) return reject(err);

            resolve(remoteFile);
          });
        });
      });
    });
  }

  public async deleteRemoteFile(remoteFile: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.connection.sftp((err, sftp) => {
        if (err) return reject(err);
        sftp.unlink(remoteFile, (err) => {
          if (err) return reject(err);
          resolve(true);
        });
      });
    });
  }

  public disconnect(): void {
    if (this.isConnected) {
      this.connection.end();
    }
  }
}
