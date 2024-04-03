import { z } from "zod";
import { StepSchema } from "./step.schema";

export const TaskSchema = z.object({
  name: z.string(),
  workingDir: z.string().optional().default("."),
  steps: z.array(StepSchema),
  logOutput: z.boolean().optional().default(true),
  disabled: z.boolean().optional().default(false),
});

export type Task = z.infer<typeof TaskSchema>;
