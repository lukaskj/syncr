import { CommandStep, ScriptStep, Step, UploadFileStep } from "../schemas/scenario/step.schema";
import { loggContinue } from "./logger";

export function stepIsCommand(step: Step): step is CommandStep {
  return "command" in step;
}

export function stepIsScript(step: Step): step is ScriptStep {
  return "script" in step;
}

export function stepIsUploadFile(step: Step): step is UploadFileStep {
  return "uploadFile" in step;
}

export function logDisabledStep(spacing: number, step: Step): void {
  let description = "";
  if (stepIsCommand(step)) {
    description = `Command '${step.command}' disabled`;
  }

  if (stepIsScript(step)) {
    description = `Script '${step.script}' disabled`;
  }

  if (stepIsUploadFile(step)) {
    description = `UploadFile '${step.uploadFile}' disabled`;
  }

  loggContinue(spacing, description);
}
