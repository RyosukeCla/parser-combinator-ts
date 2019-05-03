import fs from "fs";
import path from "path";
import * as P from "../../src";

enum BlockType {
  Open = 'Open',
  Close = 'Close',
  SelfClose = 'SelfClose',
  Doctype = 'Doctype',
  Comment = 'Comment',
  Contents = 'Contents',

  // for json
  Tag = 'Tag',
}

interface Attributes {
  [attr: string]: string
}

interface Block {
  type: BlockType,
  name: string,
  attributes: Attributes
}

const htmlTokenizer = () => {
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

class DomNode {
  private parent: DomNode | null
  private children: DomNode[]
  private value: any
  constructor(value: any) {
    this.value = value
    this.children = []
    this.parent = null
  }
  setParent(parent: DomNode) {
    this.parent = parent
  }
  addChild(child: DomNode) {
    this.children.push(child)
  }
  assign(value: any) {
    Object.assign(this.value, value)
  }
  getParent() {
    return this.parent
  }
  getChildren() {
    return this.children
  }
  getValue() {
    return this.value
  }
}

const domNodeToJson = (node: DomNode) => {
  const result: any = node.getValue()
  const children = node.getChildren().map(child => domNodeToJson(child))
  if (children.length) {
    result.children = children
  }
  return result
}

const parseHtml = (blocks: Block[]) => {
  const SELF_CLOSING_TAGS = [
    "area",
    "base",
    "br",
    "col",
    "embed",
    "hr",
    "img",
    "input",
    "link",
    "meta",
    "param",
    "source",
    "track",
    "wbr"
  ]
  let html = new DomNode({})
  let currentDom = html
  let isTopLevelDom = true
  for (const block of blocks) {
    const type = block.type
    if (type === BlockType.Open) {
      block.type = BlockType.Tag
      // top level
      if (isTopLevelDom) {
        html.assign(block)
        isTopLevelDom = false
        continue
      }

      // self closing tag
      const isSelfClosed = SELF_CLOSING_TAGS.find(tag => tag === block.name.toLowerCase())
      if (isSelfClosed) {
        const dom = new DomNode(block)
        currentDom.addChild(dom)
        continue
      }

      // normal tag open
      const dom = new DomNode(block)
      currentDom.addChild(dom)
      dom.setParent(currentDom)
      currentDom = dom
    } else if (type === BlockType.Close) {
      // self closing tag
      const isSelfClosed = SELF_CLOSING_TAGS.find(tag => tag === block.name.toLowerCase())
      if (isSelfClosed) {
        continue
      }

      const parent = currentDom.getParent()
      if (parent) currentDom = parent
    } else if (type === BlockType.SelfClose) {
      block.type = BlockType.Tag
      const dom = new DomNode(block)
      currentDom.addChild(dom)
    } else if (type === BlockType.Comment || type === BlockType.Contents) {
      const dom = new DomNode(block)
      currentDom.addChild(dom)
    } else if (type === BlockType.Doctype) {
      html.assign({
        doctype: block.attributes
      })
    }
  }
  return html
}

const main = () => {
  const tokenizer = htmlTokenizer()
  const html = fs.readFileSync(path.join(__dirname, "./sample.html"));
  const tokenized = P.parse(tokenizer, html.toString()) as P.PNodes;
  console.log(tokenized.toString())
  const blocks = tokenized.unwrap().map(value => value.unwrap() as Block)
  console.log(blocks);
  const parsed = parseHtml(blocks);
  const parsedJson = domNodeToJson(parsed)
  const jsonStr = JSON.stringify(parsedJson, null, '  ')
  console.log(jsonStr)
  fs.writeFileSync(path.join(__dirname, "./parsed.json"), jsonStr)
};

main();
