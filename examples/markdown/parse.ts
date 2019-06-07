import fs from "fs";
import path from "path";
import * as P from "../../src";

const mdParser = () => {
  // lazy
  const BlockContent = P.lazy();
  const PhrasingContent = P.lazy();

  const Newline = P.regex(/(\r\n|\n|\r)/);

  // nodes
  const Text = P.regex(/(\w| )+/);
  const Heading = P.seq(
    P.regex(/#{1,6}/),
    P.token(" "),
    P.many(PhrasingContent.getParser())
  );
  const ThematicBreak = P.choice(
    P.manyN(3)(P.token("-")),
    P.manyN(3)(P.token("*"))
  );
  const Blockquote = P.seq(
    P.token(">"),
    P.many(BlockContent.getParser()) // >aiueo or >aiueo
  );
  const Code = P.seq(
    P.token("```"),
    P.regex(/\w*/),
    Newline,
    Text,
    P.token("```")
  );

  BlockContent.setParser(P.choice(Heading, ThematicBreak));
  // BlockContent.setParser(P.choice(Heading, ThematicBreak, Blockquote, Code));
  const TopLevelContent = P.choice(BlockContent.getParser());
  const Break = Newline;
  const StaticPhrasingContent = P.choice(Text, Break);
  PhrasingContent.setParser(P.choice(StaticPhrasingContent));
  const Content = P.choice(TopLevelContent, PhrasingContent.getParser());
  const Root = P.always(Content);
  return Root;
};

const main = () => {
  const parser = mdParser();
  const md = fs.readFileSync(path.join(__dirname, "./sample.md"));
  const res = P.parse(parser, md.toString());
  console.log(md.toString());
  console.log(res.toString());
  // fs.writeFileSync(path.join(__dirname, "./parsed.txt"), res.toString());
};

main();
