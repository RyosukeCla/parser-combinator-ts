import { Parser, PNodes, none } from "./core";
import { debug, DebugProcess } from "./debugger";

const _DEBUG_PROCESS: DebugProcess = {
  type: "manyN"
};

const combinator = (n: number) => <A>(parser: Parser<A>): Parser<A> => {
  return debug(_DEBUG_PROCESS)(target => position => {
    const result: PNodes<A> = new PNodes();
    let nextPosition = position;

    for (let i = 0; i < n; i++) {
      const parsed = parser(target)(nextPosition);
      if (parsed.success) {
        if (!parsed.node.isNone()) result.push(parsed.node);
        nextPosition = parsed.position;
      } else {
        return {
          success: false,
          node: none,
          position: nextPosition
        }
      }
    }

    while (true) {
      const parsed = parser(target)(nextPosition);
      if (parsed.success) {
        if (!parsed.node.isNone()) result.push(parsed.node);
        nextPosition = parsed.position;
      } else {
        break;
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
