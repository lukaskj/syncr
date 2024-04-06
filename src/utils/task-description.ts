import { Task } from "../schemas/scenario/task.schema";
import { taskIsCommand, taskIsScript, taskIsUploadFile } from "./task-check";

export function getTaskDescription(task: Task): string {
  if (taskIsCommand(task)) {
    return task.name ?? task.command;
  }

  if (taskIsScript(task)) {
    return task.name ?? task.script;
  }

  if (taskIsUploadFile(task)) {
    return task.name ?? task.uploadFile;
  }

  return "";
}
