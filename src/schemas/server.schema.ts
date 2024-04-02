import { z } from "zod";

export const ServerSchema = z.object({
  host: z.string(),
  port: z.number().int().positive().default(22),
  username: z.string(),
  password: z.string().optional(),
  identityFile: z.string().optional(),
});

export type Server = z.infer<typeof ServerSchema>;
