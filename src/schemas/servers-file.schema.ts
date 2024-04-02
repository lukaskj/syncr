import { z } from "zod";
import { ServerSchema } from "./server.schema";

export const ServersFileSchema = z.record(z.string(), z.array(ServerSchema));

export type Servers = z.infer<typeof ServersFileSchema>;
