import { z } from "zod";

export const TaskSchema = z.object({ name: z.string(), commands: z.array(z.string()) });

export type Task = z.infer<typeof TaskSchema>;
