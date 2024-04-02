import { z } from "zod";

export const CommandScriptSchema = z.object({
  script: z.string(),
});

export const TaskSchema = z.object({
  name: z.string(),
  workingDir: z.string().optional().default("~"),
  commands: z.array(z.string().or(CommandScriptSchema)),
  logOutput: z.boolean().optional().default(false),
});

export type Task = z.infer<typeof TaskSchema>;
