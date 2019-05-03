import { Parser, PNodes, none } from "./core";
import { debug, DebugProcess } from "./debugger";

const _DEBUG_PROCESS: DebugProcess = {
  type: "seq"
};

const combinator = (...parsers: Array<Parser>): Parser => {
  return debug(_DEBUG_PROCESS)(target => position => {
    const result: PNodes = new PNodes();
    let nextPosition = position;

    for (const parser of parsers) {
      const parsed = parser(target)(nextPosition);
      if (parsed.success) {
        if (!parsed.node.isNone()) result.push(parsed.node);
        nextPosition = parsed.position;
      } else {
        return {
          success: false,
          node: none,
          position: nextPosition
        };
      }
    }

    return {
      success: true,
      node: result,
      position: nextPosition
    };
  });
};

export default combinator;
