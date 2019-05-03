import { Parser } from "./core";

const combinator = (sub: string) => <A>(parser: Parser<A>): Parser<A> => {
  return target => position => {
    const parsed = parser(target)(position);
    console.log(
      `[log]`,
      `${sub}, s: ${parsed.success}, p: ${position}, next p: ${parsed.position}`
    );
    return parsed;
  };
};

export default combinator;
