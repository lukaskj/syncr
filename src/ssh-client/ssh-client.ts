import { readFileSync } from "fs";
import { Client } from "ssh2";
import { Task } from "../schemas/scenario/task.schema";
import { Server } from "../schemas/server.schema";
import { isNullOrEmptyOrUndefined } from "../utils/is-null-or-undefined";
import { logContinue, logg } from "../utils/logger";

// type TSshClientParams = Parameters<typeof Client.prototype.connect>[0];

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
        console.log(`"${this.name}" - ERROR:`, err);
        reject(err);
      });
    });
  }

  public async executeTask(task: Task): Promise<boolean> {
    logg(3, `Task: '${task.name}'`, `Server: '${this.name}'`);
    if (!this.isConnected) {
      logg(4, `[-] '${this.name}' not connected.`);
      return Promise.resolve(false);
    }

    for (const command of task.commands) {
      logg(4, `Command: '${command}'`);
      await this.executeCommand(command, task.workingDir, task.logOutput);
      logg(4, `Done`);
    }

    logContinue(1, "");

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
        if (err) throw err;
        stream
          .on("close", (code: number, _signal: number) => {
            resolve(code);
          })
          .on("data", (data: string) => {
            if (showOutput) {
              logg(0, data.toString());
            }
          })
          .stderr.on("data", (data) => {
            reject(data.toString());
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
