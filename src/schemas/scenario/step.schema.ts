import { z } from "zod";

export const CommandSchema = z.object({
  command: z.string(),
});

export const ScriptSchema = z.object({
  script: z.string(),
  mode: z.number().optional().default(0o755),
});

export const UploadFileSchema = z.object({
  uploadFile: z.string(),
  mode: z.number().optional().default(0o755),
});

export const StepSchema = z.union([CommandSchema, ScriptSchema, UploadFileSchema]);

export type Step = z.infer<typeof StepSchema>;

export type CommandStep = z.infer<typeof CommandSchema>;
export type ScriptStep = z.infer<typeof ScriptSchema>;
export type UploadFileStep = z.infer<typeof UploadFileSchema>;
