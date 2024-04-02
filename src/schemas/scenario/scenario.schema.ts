import { z } from "zod";
import { TaskSchema } from "./task.schema";

export const ScenarioSchema = z.array(
  z.object({
    name: z.string(),
    hosts: z.string().or(z.array(z.string())),
    tasks: z.array(TaskSchema),
  }),
);

export type Scenario = z.infer<typeof ScenarioSchema>;
