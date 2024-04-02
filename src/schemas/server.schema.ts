import { z } from "zod";

export const ServerSchema = z.object({
  name: z.string().optional(),
  host: z.string(),
  port: z.number().int().positive().default(22),
  username: z.string(),
  password: z.string().optional(),
  identityFile: z.union([z.string(), z.instanceof(Buffer)]).optional(),
});

export type Server = z.infer<typeof ServerSchema>;
