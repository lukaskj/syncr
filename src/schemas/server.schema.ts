import { existsSync } from "node:fs";
import { z } from "zod";

export const ServerSchema = z.object({
  name: z.string().optional(),
  host: z.string(),
  port: z.number().int().positive().default(22),
  username: z.string(),
  password: z.string().optional(),
  identityFile: z
    .union([z.string(), z.instanceof(Buffer)])
    .optional()
    .refine(
      (filePath) => {
        if (!filePath || filePath instanceof Buffer) return true;
        if (!existsSync(filePath)) return false;
        return true;
      },
      (filePath) => ({ message: `Identify file not found at '${filePath}'.` }),
    ),
  disabled: z.boolean().optional().default(false),
  timeout: z.number().optional().default(10000),
});

export type Server = z.infer<typeof ServerSchema>;
