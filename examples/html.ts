import fs from "fs";
import path from "path";
import * as P from "../src";

const htmlParser = () => {
  const angleBracketOpen = P.token("<");
  const angleBracketClose = P.token(">");
  const slash = P.token("/");
  const equal = P.token("=");
  const identifier = P.regex(/[0-9a-zA-Z_:-]+/);
  const empty = P.map(_ => P.none);
  const ws = empty(P.regex(/\s*/m));
  const singleQuoteDelimiter = empty(P.token("'"));
  const doubleQuoteDelimiter = empty(P.token('"'));
  const characters = P.regex(/[^<>]+/);
  const charactersInSingleQuote = P.regex(/[^']+/);
  const charactersInDoubleQuote = P.regex(/[^"]+/);
  const between = (a: P.Parser) => (parser: P.Parser) => {
    return P.seq(a, parser, a);
  };

  const attributes = P.flat(
    P.many(
      P.seq(
        ws,
        P.choice(
          P.flat(
            P.seq(
              identifier,
              empty(between(ws)(equal)),
              P.choice(
                between(singleQuoteDelimiter)(charactersInSingleQuote),
                between(doubleQuoteDelimiter)(charactersInDoubleQuote),
                identifier
              )
            )
          ),
          P.unit(identifier)
        )
      )
    )
  );

  const tagOpen = P.seq(
    empty(P.seq(angleBracketOpen)),
    identifier,
    attributes,
    empty(P.seq(ws, angleBracketClose))
  );

  const tagClose = empty(
    P.seq(angleBracketOpen, slash, identifier, ws, angleBracketClose)
  );
  const tagSelfClose = P.seq(
    empty(P.seq(angleBracketOpen, ws)),
    identifier,
    attributes,
    empty(P.seq(ws, slash, angleBracketClose))
  );

  const body = P.lazy();

  const tag = P.flat(P.seq(tagOpen, P.unit(body.getParser()), tagClose));

  const doctype = P.seq(
    P.choice(P.token("<!DOCTYPE"), P.token("<!doctype")),
    P.flat(
      P.flat(
        P.many(
          P.seq(
            ws,
            P.choice(
              identifier,
              between(singleQuoteDelimiter)(charactersInSingleQuote),
              between(doubleQuoteDelimiter)(charactersInDoubleQuote)
            )
          )
        )
      )
    ),
    ws,
    empty(angleBracketClose)
  );

  const comment = P.flat(
    P.seq(P.token("<!--"), P.regex(/(.|\s)*(?=-->)/m), empty(P.token("-->")))
  );

  const paragraph = P.choice(
    tag,
    tagSelfClose,
    empty(P.regex(/\s/)),
    characters,
    comment,
    doctype
  );

  body.setParser(P.many(paragraph));

  const parser = P.always(paragraph);
  return parser;
};

const main = () => {
  const parser = htmlParser();
  const html = fs.readFileSync(path.join(__dirname, "./samples/sample.html"));
  const res = P.parse(parser, html.toString());
  console.log(res.toString());
};

main();