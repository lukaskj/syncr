import { z } from "zod";
import { DEFAULT_WORKING_DIR } from "../../consts";

const BaseTaskSchema = z.object({
  name: z.string().optional(),
  workingDir: z.string().optional().default(DEFAULT_WORKING_DIR),
  logOutput: z.boolean().optional().default(false),
  disabled: z.boolean().optional().default(false),
});

export const CommandTaskSchema = BaseTaskSchema.extend({
  command: z.string(),
});

export const ScriptTaskSchema = BaseTaskSchema.extend({
  script: z.string(),
  mode: z.number().optional().default(0o755),
});

export const UploadFileTaskSchema = BaseTaskSchema.extend({
  uploadFile: z.string(),
  mode: z.number().optional().default(0o644),
});

export const TaskSchema = z.union([CommandTaskSchema, ScriptTaskSchema, UploadFileTaskSchema]);

export type Task = z.infer<typeof TaskSchema>;
export type CommandTask = z.infer<typeof CommandTaskSchema>;
export type ScriptTask = z.infer<typeof ScriptTaskSchema>;
export type UploadFileTask = z.infer<typeof UploadFileTaskSchema>;
