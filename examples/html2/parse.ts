import fs from "fs";
import path from "path";
import * as P from "../../src";

enum BlockType {
  Open = 'Open',
  Close = 'Close',
  SelfClose = 'SelfClose',
  Doctype = 'Doctype',
  Comment = 'Comment',
  Contents = 'Contents'
}

interface Attributes {
  [attr: string]: string
}

interface Block {
  type: BlockType,
  name: string,
  attributes: Attributes
}

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

  const toBlock = (type:  BlockType) => P.map(nodes => {
    const identifier = nodes.pick(0).unwrap() as string
    const attributeNodes = nodes.pick(1) as P.PNodes
    const attributes: Attributes = {}
    if (!attributeNodes.isNone()) {
      attributeNodes.forEach(aNode => {
        const attrName = aNode.pick(0).unwrap() as string
        const attrValue = aNode.pick(1)
        attributes[attrName] = attrValue.isNone() ? "true" : attrValue.unwrap() as string
      })
    }
    return P.value<Block>({
      type: type,
      name: identifier,
      attributes: attributes
    })
  })

  const tagOpen = toBlock(BlockType.Open)(P.seq(
    empty(P.seq(angleBracketOpen)),
    identifier,
    attributes,
    empty(P.seq(ws, angleBracketClose))
  ));

  const tagClose = toBlock(BlockType.Close)(P.unit(P.pick(2)(
    P.seq(angleBracketOpen, slash, identifier, ws, angleBracketClose)
  )))
  const selfClosingTag = toBlock(BlockType.SelfClose)(P.seq(
    empty(P.seq(angleBracketOpen)),
    identifier,
    attributes,
    empty(P.seq(ws, slash, angleBracketClose))
  ));

  const doctype = toBlock(BlockType.Doctype)(P.seq(
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
  ));

  const comment = toBlock(BlockType.Comment)(P.unit(P.pick(1)(
    P.seq(P.token("<!--"), P.regex(/(.|\s)*(?=-->)/m), P.token("-->"))
  )));

  const paragraph = P.choice(
    doctype,
    selfClosingTag,
    tagOpen,
    tagClose,
    empty(P.regex(/\s/)),
    toBlock(BlockType.Contents)(P.unit(characters)),
    comment,
  );

  const parser = P.always(paragraph);
  return parser;
};

const main = () => {
  const parser = htmlParser();
  const html = fs.readFileSync(path.join(__dirname, "./sample.html"));
  const res = P.parse(parser, html.toString());
  console.log(res.toString());
  fs.writeFileSync(path.join(__dirname, "./parsed.txt"), res.toString());
};

main();
