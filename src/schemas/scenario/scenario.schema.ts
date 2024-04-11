import { z } from "zod";
import { DEFAULT_WORKING_DIR } from "../../consts";
import { TaskSchema } from "./task.schema";

export const ScenarioSchema = z.object({
  name: z.string(),
  hosts: z.string().or(z.array(z.string()).nonempty()),
  tasks: z.array(TaskSchema),
  disabled: z.boolean().optional().default(false),
  concurent: z.boolean().optional().default(true).describe("Run *hosts* concurrenly, not tasks concurrently."),
  scenarioFileBasePath: z.string().optional().default(DEFAULT_WORKING_DIR),
});

export const ScenariosSchema = z.array(ScenarioSchema);

export type Scenario = z.infer<typeof ScenarioSchema>;
