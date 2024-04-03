import { CommandStep, ScriptStep, Step, UploadFileStep } from "../schemas/scenario/step.schema";

export function stepIsCommand(step: Step): step is CommandStep {
  return "command" in step;
}

export function stepIsScript(step: Step): step is ScriptStep {
  return "script" in step;
}

export function stepIsUploadFile(step: Step): step is UploadFileStep {
  return "uploadFile" in step;
}
