import { Parser } from "./core";
import { debug, DebugProcess } from "./debugger";

const _DEBUG_PROCESS: DebugProcess = {
  type: "lazy"
};

class Lazy<A> {
  private parser: Parser<A> | null;
  constructor() {
    this.parser = null;
  }

  setParser(parser: Parser<A>) {
    this.parser = parser;
  }

  getParser(): Parser<A> {
    return debug(_DEBUG_PROCESS)(target => position => {
      if (!this.parser) throw new Error("set parser");
      const parsed = this.parser(target)(position);
      return parsed;
    });
  }
}

export default () => {
  return new Lazy();
};
