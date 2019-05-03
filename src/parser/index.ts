import { Parser } from "./core";
import { _DEBUGGER_ } from "./debugger";

// base
export { Parser, PNode, Value, None, PNodes, nodes, value, none } from "./core";

// atoms
export { default as token } from "./token";
export { default as regex } from "./regex";

// basics
export { default as seq } from "./seq";
export { default as option } from "./option";
export { default as choice } from "./choice";
export { default as many } from "./many";
export { default as always } from "./always";

// monad
export { default as map } from "./map";
export { default as flat } from "./flat";
export { default as flatMap } from "./flatMap";
export { default as unit } from "./unit";
export { default as pick } from "./pick";

// the applied
export { default as lazy } from "./lazy";

// etc
export { default as log } from "./log";
export { debug } from "./debugger";

// api
export const parse = <A>(parser: Parser<A>, target: string) => {
  _DEBUGGER_.clear();

  const targetLen = target.length;
  const parsed = parser(target)(0);
  if (parsed.success && parsed.position === targetLen) {
    return parsed.node;
  } else {
    _DEBUGGER_.analyze();
    console.log((parsed.node || "").toString());
    throw new Error(`couldn't parse at ${parsed.position}`);
  }
};
