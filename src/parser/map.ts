import { Parser, PNodeMapper, none } from "./core";
import { debug, DebugProcess } from "./debugger";

const _DEBUG_PROCESS: DebugProcess = {
  type: "map"
};

const combinator = <A, B>(mapper: PNodeMapper<A, B>) => (
  parser: Parser<A>
): Parser<B> => {
  return debug(_DEBUG_PROCESS)(target => position => {
    const parsed = parser(target)(position);

    if (parsed.success) {
      return {
        success: true,
        node: parsed.node.matchMap(mapper),
        position: parsed.position
      };
    } else {
      return {
        success: false,
        node: none,
        position: parsed.position
      };
    }
  });
};

export default combinator;
