import { CommandTask, ScriptTask, Task, UploadFileTask } from "../schemas/scenario/task.schema";

export function taskIsCommand(task: Task): task is CommandTask {
  return "command" in task;
}

export function taskIsScript(task: Task): task is ScriptTask {
  return "script" in task;
}

export function taskIsUploadFile(task: Task): task is UploadFileTask {
  return "uploadFile" in task;
}
