import { Parser, PNodes, none } from "./core";
import { debug, DebugProcess } from "./debugger";

const _DEBUG_PROCESS: DebugProcess = {
  type: "always"
};

const combinator = <A>(parser: Parser<A>): Parser<A> => {
  return debug(_DEBUG_PROCESS)(target => position => {
    const result: PNodes<A> = new PNodes();
    let nextPosition = position;

    while (true) {
      if (target.length <= nextPosition) break;
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
