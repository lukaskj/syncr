import { readFileSync } from "fs";
import { basename, join } from "path";
import { Client } from "ssh2";
import { Task } from "../schemas/scenario/task.schema";
import { Server } from "../schemas/server.schema";
import { logg, loggContinue, loggMultiLine } from "../utils/logger";
import { logDisabledStep, stepIsCommand, stepIsScript, stepIsUploadFile } from "../utils/step-check";

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

  public async executeTask(task: Task): Promise<boolean> {
    const baseLogSpacing = 2;

    if (!this.isConnected) {
      logg(baseLogSpacing + 1, `[-] '${this.name}' not connected`);
      return Promise.resolve(false);
    }

    for (const step of task.steps) {
      if (step.disabled) {
        logDisabledStep(baseLogSpacing + 1, step);
        logg(baseLogSpacing + 1, `Done`);
        loggContinue(1, "");
        continue;
      }

      if (stepIsCommand(step)) {
        logg(baseLogSpacing + 1, `Command: '${step.command}'`, `Server: '${this.name}'`);
        await this.executeCommand(step.command, task.workingDir, task.logOutput);
      } else if (stepIsScript(step)) {
        logg(baseLogSpacing + 1, `Script: '${step.script}'`, `Server: '${this.name}'`);

        const remoteFileLocation = await this.uploadFile(step.script, task.workingDir);

        await this.executeCommand(`${remoteFileLocation}`, task.workingDir, task.logOutput);

        await this.deleteFile(remoteFileLocation);
      } else if (stepIsUploadFile(step)) {
        logg(baseLogSpacing + 1, `Upload file: '${step.uploadFile}'`, `Server: '${this.name}'`);
        await this.uploadFile(step.uploadFile, task.workingDir, step.mode);
      }

      logg(baseLogSpacing + 1, `Done`);
      loggContinue(1, "");
    }

    return true;
  }

  public executeCommand(command: string, workingDir = ".", logOutput = false): Promise<number> {
    if (!this.isConnected) {
      logg(4, `[-] '${this.name}' not connected`);
      return Promise.resolve(1);
    }

    const conn = this.connection;
    const showOutput = this.verbose || logOutput;

    return new Promise((resolve, reject) => {
      const commandWithWorkingDir = `cd ${workingDir} && ${command}`;

      conn.exec(commandWithWorkingDir, {}, (err, stream) => {
        if (err) return reject(err);
        stream
          .on("close", (code: number, _signal: number) => {
            resolve(code);
          })
          .on("data", (data: string) => {
            if (showOutput) {
              loggMultiLine(5, data.toString());
            }
          })
          .stderr.on("data", (data) => {
            reject(data.toString());
          });
      });
    });
  }

  public async uploadFile(localFile: string, workingDir = ".", mode: number = 0o755): Promise<string> {
    return new Promise((resolve, reject) => {
      this.connection.sftp((err, sftp) => {
        if (err) return reject(err);

        const fileName = basename(localFile);
        const remoteFile = `${workingDir}/${fileName}`;

        sftp.fastPut(join(localFile), remoteFile, (err: unknown) => {
          if (err) return reject(err);
          sftp.chmod(remoteFile, mode, (err) => {
            if (err) return reject(err);

            resolve(remoteFile);
          });
        });
      });
    });
  }

  public async deleteFile(remoteFile: string): Promise<boolean> {
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
