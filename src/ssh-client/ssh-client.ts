import { readFileSync } from "fs";
import { basename, join } from "path";
import { Client } from "ssh2";
import { Task } from "../schemas/scenario/task.schema";
import { Server } from "../schemas/server.schema";
import { isNullOrEmptyOrUndefined, isNullOrUndefined } from "../utils/is-null-or-undefined";
import { logg, loggContinue, loggMultiLine } from "../utils/logger";

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
      });

      this.connection.on("ready", () => {
        if (verbose) {
          logg(1, `${this.name} connected.`);
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
    const baseLogSpacing = 3;
    logg(baseLogSpacing, `Task: '${task.name}'`, `Server: '${this.name}'`);

    if (!this.isConnected) {
      logg(baseLogSpacing + 1, `[-] '${this.name}' not connected.`);
      return Promise.resolve(false);
    }

    for (const command of task.commands) {
      if (typeof command === "string") {
        logg(baseLogSpacing + 1, `Command: '${command}'`);
        await this.executeCommand(command, task.workingDir, task.logOutput);
      } else if (!isNullOrUndefined(command.script)) {
        logg(baseLogSpacing + 1, `Script: '${command.script}'`);
        const remoteFileLocation = await this.uploadFile(command.script, task.workingDir);

        await this.executeCommand(`${remoteFileLocation}`, task.workingDir, task.logOutput);

        await this.deleteFile(remoteFileLocation);
      }

      logg(baseLogSpacing + 1, `Done`);
      loggContinue(1, "");
    }

    return true;
  }

  public executeCommand(command: string, workingDir = "~", logOutput = false): Promise<number> {
    if (!this.isConnected) {
      logg(4, `[-] '${this.name}' not connected.`);
      return Promise.resolve(1);
    }

    const conn = this.connection;
    const showOutput = this.verbose || logOutput;

    return new Promise((resolve, reject) => {
      if (!isNullOrEmptyOrUndefined(workingDir) && workingDir.trim() !== "~") {
        workingDir = `'${workingDir}'`;
      }

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

  public async uploadFile(localFile: string, workingDir = "~"): Promise<string> {
    return new Promise((resolve, reject) => {
      this.connection.sftp((err, sftp) => {
        if (err) return reject(err);

        const fileName = basename(localFile);
        const remoteFile = `${workingDir}/${fileName}`;

        sftp.fastPut(join(localFile), remoteFile, (err: unknown) => {
          if (err) return reject(err);
          sftp.chmod(remoteFile, 0o755, (err) => {
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
