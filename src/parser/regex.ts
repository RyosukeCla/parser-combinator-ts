import { Parser, value, none } from "./core";
import { debug, DebugProcess } from "./debugger";

const _DEBUG_PROCESS = (regex: string): DebugProcess => {
  return {
    type: `regex: ${regex}`
  };
};

const combinator = (regex: RegExp): Parser<string> => {
  if (regex.source.substring(0, 1) !== "^") {
    regex = new RegExp("^" + regex.source, regex.flags);
  }

  return debug(_DEBUG_PROCESS(`/${regex.source}/${regex.flags}`))(
    target => position => {
      regex.lastIndex = 0;
      const res = regex.exec(target.substr(position));
      if (res) {
        return {
          success: true,
          node: value(res[0]),
          position: position + res[0].length
        };
      } else {
        return {
          success: false,
          node: none,
          position
        };
      }
    }
  );
};

export default combinator;
