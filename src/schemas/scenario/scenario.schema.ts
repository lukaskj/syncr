import { z } from "zod";
import { TaskSchema } from "./task.schema";

export const ScenarioSchema = z.object({
  name: z.string().optional(),
  hosts: z.string().or(z.array(z.string()).nonempty()),
  tasks: z.record(z.string(), TaskSchema),
  disabled: z.boolean().optional().default(false),
  scenarioFileBasePath: z.string().optional().default("."),
});

export const ScenariosSchema = z.record(z.string(), ScenarioSchema);

export type Scenario = z.infer<typeof ScenarioSchema>;
