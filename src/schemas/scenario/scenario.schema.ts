import { z } from "zod";
import { TaskSchema } from "./task.schema";

export const ScenarioSchema = z.array(
  z.object({
    name: z.string(),
    groups: z.string().or(z.array(z.string())),
    tasks: z.array(TaskSchema),
    disabled: z.boolean().optional().default(false),
    scenarioFileBasePath: z.string().optional().default("."),
  }),
);

export type Scenario = z.infer<typeof ScenarioSchema>;
