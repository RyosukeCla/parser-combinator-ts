import { Parser } from "./core";
import { debug, DebugProcess } from "./debugger";

const _DEBUG_PROCESS: DebugProcess = {
  type: "flat"
};

const combinator = <A>(parser: Parser<A>): Parser<A> => {
  return debug(_DEBUG_PROCESS)(target => position => {
    const parsed = parser(target)(position);

    if (parsed.success) {
      return {
        success: true,
        node: parsed.node.flat(),
        position: parsed.position
      };
    } else {
      return parsed;
    }
  });
};

export default combinator;
