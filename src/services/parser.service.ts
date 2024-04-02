import { Service } from "typedi";
import { ZodError, z } from "zod";
import { readFile } from "node:fs/promises";
import { fromZodError } from "zod-validation-error";

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
    const fileContents = await readFile(filePath);
    const obj = JSON.parse(fileContents.toString());
    return this.parse(obj, schema);
  }
}
