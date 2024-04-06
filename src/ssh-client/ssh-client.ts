import { basename } from "node:path";
import { Client, ClientChannel } from "ssh2";
import { CommandTask, UploadFileTask } from "../schemas/scenario/task.schema";
import { Server } from "../schemas/server.schema";

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

      this.connection.on("error", (err) => {
        reject(err);
      });
    });
  }

  public executeRemoteCommand(task: CommandTask): Promise<ClientChannel | string> {
    if (!this.isConnected) {
      return Promise.resolve(`[-] '${this.name}' not connected`);
    }

    const workingDir = task.workingDir;

    const conn = this.connection;

    return new Promise((resolve, reject) => {
      const commandWithWorkingDir = `cd ${workingDir} && ${task.command}`;

      conn.exec(commandWithWorkingDir, {}, (err, stream) => {
        if (err) return reject(err);
        resolve(stream);
      });
    });
  }

  public async uploadFile(uploadFileTask: UploadFileTask): Promise<string> {
    const localFile: string = uploadFileTask.uploadFile;
    const serverWorkingDir = uploadFileTask.workingDir;
    const mode: number = uploadFileTask.mode;

    return new Promise((resolve, reject) => {
      this.connection.sftp((err, sftp) => {
        if (err) return reject(err);

        const fileName = basename(localFile);
        const remoteFile = `${serverWorkingDir}/${fileName}`;

        sftp.fastPut(localFile, remoteFile, (err: unknown) => {
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
          return resolve(true);
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
