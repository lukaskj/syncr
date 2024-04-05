import { load } from "js-yaml";
import { readFile } from "node:fs/promises";
import { dirname, extname, resolve } from "node:path";
import { Service } from "typedi";
import { ZodError, z } from "zod";
import { fromZodError } from "zod-validation-error";
import { Scenario, ScenariosSchema } from "../schemas/scenario/scenario.schema";

@Service()
export class ParserService {
  public async parse<T extends z.ZodTypeAny>(obj: object, schema: T): Promise<z.infer<T>> {
    try {
      return await schema.parseAsync(obj);
    } catch (err) {
      if (err instanceof ZodError) {
        const validationError = fromZodError(err);
        throw new Error(validationError.message);
      } else {
        throw err;
      }
    }
  }

  public async parseFile<T extends z.ZodTypeAny>(filePath: string, schema: T): Promise<z.infer<T>> {
    const extension = extname(filePath);
    const fileContents = await readFile(filePath);
    let obj: object;
    switch (extension) {
      case ".yaml":
      case ".yml":
        obj = load(fileContents.toString()) as object;
        break;
      default:
        obj = JSON.parse(fileContents.toString());
    }

    return this.parse(obj, schema);
  }

  public async parseScenariosFiles(scenarioFiles: string[]): Promise<Scenario[]> {
    const result: Scenario[] = [];

    for (const scenarioFile of scenarioFiles) {
      const scenarios = await this.parseFile(scenarioFile, ScenariosSchema);
      for (const key in scenarios) {
        const scenario = scenarios[key];
        scenario.name = scenario.name ?? key;
        scenario.scenarioFileBasePath = dirname(resolve(scenarioFile));
        result.push(scenario);
      }
    }

    return result;
  }
}
