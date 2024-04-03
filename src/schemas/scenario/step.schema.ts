import { z } from "zod";

const BaseStepSchema = z.object({
  disabled: z.boolean().optional().default(false),
});

export const CommandSchema = BaseStepSchema.extend({
  command: z.string(),
});

export const ScriptSchema = BaseStepSchema.extend({
  script: z.string(),
  mode: z.number().optional().default(0o755),
});

export const UploadFileSchema = BaseStepSchema.extend({
  uploadFile: z.string(),
  mode: z.number().optional().default(0o755),
});

export const StepSchema = z.union([CommandSchema, ScriptSchema, UploadFileSchema]);

export type Step = z.infer<typeof StepSchema>;

export type CommandStep = z.infer<typeof CommandSchema>;
export type ScriptStep = z.infer<typeof ScriptSchema>;
export type UploadFileStep = z.infer<typeof UploadFileSchema>;
