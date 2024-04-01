import { OptsService } from "./services/opts.service";
import { Injectable } from "./utils";

@Injectable()
export class App {
  constructor(private optsService: OptsService) {}
  public async start(): Promise<void> {
    const options = this.optsService.handleArgs();
    console.log({ options });
  }
}
