import { basename } from "node:path";
import { Client, ClientChannel } from "ssh2";
import { DEFAULT_WORKING_DIR } from "../consts";
import { Server } from "../schemas/server.schema";
import { escapePath } from "../utils";
import { UploadFileTaskResult } from "./types";

export class SshClient {
  public isConnected = false;
  public connection: Client;
  private params: Server;

  public get name(): string {
    return this.params.name ?? `${this.params.host}:${this.params.port}`;
  }

  constructor(params: Server) {
    this.params = params;
    this.connection = new Client();
  }

  public async connect(): Promise<boolean> {
    if (this.isConnected) {
      return Promise.resolve(true);
    }

    return new Promise((resolve, reject) => {
      this.connection.connect({
        host: this.params.host,
        port: this.params.port,
        username: this.params.username,
        password: this.params.password,
        privateKey: this.params.identityFile,
        readyTimeout: this.params.timeout,
      });

      this.connection.on("ready", () => {
        this.isConnected = true;
        resolve(true);
      });

      this.connection.on("end", () => {
        this.isConnected = false;
      });

      this.connection.on("close", () => {
        this.isConnected = false;
      });

      this.connection.on("error", (err) => {
        reject(err);
      });
    });
  }

  public async executeRemoteCommand(
    command: string,
    workingDir = DEFAULT_WORKING_DIR,
  ): Promise<ClientChannel | string> {
    if (!this.isConnected) {
      return Promise.resolve(`[-] '${this.name}' not connected`);
    }

    const conn = this.connection;
    const cdWorkingDir = workingDir !== DEFAULT_WORKING_DIR ? `cd ${escapePath(workingDir)} && ` : "";
    const commandWithWorkingDir = cdWorkingDir + command;

    return new Promise((resolve, reject) => {
      conn.exec(commandWithWorkingDir, {}, (err, stream) => {
        if (err) return reject(err);
        resolve(stream);
      });
    });
  }

  public async uploadFile(
    localFileToUpload: string,
    serverWorkingDir: string,
    mode: number = 0o644,
  ): Promise<UploadFileTaskResult> {
    if (serverWorkingDir !== DEFAULT_WORKING_DIR) {
      await this.executeRemoteCommand(`mkdir -p ${escapePath(serverWorkingDir)}`);
    }

    return new Promise((resolve, reject) => {
      this.connection.sftp((err, sftp) => {
        if (err) return reject(err);

        const fileName = basename(localFileToUpload);
        const remoteFile = `${serverWorkingDir}/${fileName}`;

        sftp.fastPut(localFileToUpload, remoteFile, { mode }, (err) => {
          if (err) return reject(err);
          resolve({
            fileName,
            workingDir: serverWorkingDir,
            remoteFileLocation: remoteFile,
          });
        });
      });
    });
  }

  private filesToDelete: string[] = [];

  public get hasFilesToDelete(): boolean {
    return this.filesToDelete.length > 0;
  }

  public addFileToDeleteLater(remoteFile: string): void {
    this.filesToDelete.push(remoteFile);
  }

  public async deleteFilesDelayed(): Promise<void> {
    const files = this.filesToDelete;
    if (files.length === 0) return Promise.resolve();
    return new Promise((resolve, reject) => {
      this.connection.sftp((err, sftp) => {
        if (err) return reject(err);
        for (const file of files) {
          sftp.unlink(file, (err) => {
            if (err) {
              return reject(err);
            }
            resolve();
          });
        }
      });
    });
  }

  public async deleteRemoteFile(remoteFile: string): ReturnType<typeof this.executeRemoteCommand> {
    // return await this.executeRemoteCommand(`rm -r '${remoteFile}'`);

    return new Promise((resolve, reject) => {
      this.connection.sftp((err, sftp) => {
        if (err) return reject(err);
        sftp.unlink(remoteFile, (err) => {
          if (err) {
            return reject(err);
          }
          return resolve("true");
        });
      });
    });
  }

  public disconnect(): void {
    if (this.isConnected) {
      this.isConnected = false;
      this.connection.end();
    }
  }
}
