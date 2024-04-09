export type TOptions = {
  scenarios: string[];
  serversFile: string;
  debug: boolean;
  verbose: boolean;
};

export type TaskWarning = {
  scenario: string;
  host: string;
  task: string;
  message: string;
};

export type TaskError = Omit<TaskWarning, "message"> & { error: unknown };

export type Ctx = {
  warnings: Set<TaskWarning>;
  errors: Set<TaskError>;
};
