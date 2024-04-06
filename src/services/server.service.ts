import { readFile } from "node:fs/promises";
import { Service } from "typedi";
import { Server } from "../schemas/server.schema";
import { SshClient } from "../ssh-client/ssh-client";
import { isNullOrUndefined } from "../utils/is-null-or-undefined";

@Service()
export class ServerService {
  private connections: Map<Server, SshClient> = new Map();

  constructor() {}

  public async connect(serverConfig: Server): Promise<SshClient> {
    const existingConnection = this.connections.get(serverConfig);

    if (!isNullOrUndefined(existingConnection) && existingConnection.isConnected) {
      return existingConnection;
    }

    const conn = new SshClient({
      ...serverConfig,
      identityFile: serverConfig.identityFile ? await readFile(serverConfig.identityFile) : undefined,
    });

    this.connections.set(serverConfig, conn);

    await conn.connect();

    return conn;
  }

  public disconnect(serverConfigOrSshClient: Server | SshClient): void {
    if (serverConfigOrSshClient instanceof SshClient) {
      serverConfigOrSshClient.disconnect();
      for (const [serverConfig, sshClient] of this.connections.entries()) {
        if (sshClient === serverConfigOrSshClient) {
          this.connections.delete(serverConfig);
        }
      }
    } else {
      const client = this.connections.get(serverConfigOrSshClient);
      client?.disconnect();
      this.connections.delete(serverConfigOrSshClient);
    }
  }

  public disconnectAll(): void {
    for (const serverConfig of this.connections.keys()) {
      try {
        this.disconnect(serverConfig);
      } catch (error) {
        console.error(error);
      }
    }
  }
}
