/* eslint-disable @typescript-eslint/no-explicit-any */
import { Listr, ListrTaskFn } from "listr2";

export async function runListrTask(title: string, fnc: ListrTaskFn<void, any, any>): Promise<void> {
  const list = new Listr({
    title,
    task: fnc,
  });

  return await list.run();
}
