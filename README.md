# parser-combinator-ts

## examples

### html - v1

- [parse html](./examples/html/parse.ts)
- [html sample](./examples/html/sample.html)
- [parsed tree](./examples/html/parsed.txt)
- `npm run example -- ./examples/html/parse.ts`

### html - v2

- [parse html](./examples/html2/parse.ts)
- [html sample](./examples/html2/sample.html)
- [parsed tree (json)](./examples/html2/parsed.json)
- `npm run example -- ./examples/html2/parse.ts`

## usage

### parse

```ts
import * as P from "./src";

const parsed = P.parse(parser, target);
console.log(parsed.toString());
```

### parsers

#### token

```ts
P.token("token");
```

#### regex

```ts
P.regex(/regex/);
```

#### seq

```ts
P.seq(parserA, parserB, parserC);
```

#### option

```ts
P.option(parserA, parserB, parserC);
```

#### many

```ts
P.many(parser);
```

#### map

```ts
P.map(node => node)(parser);
```

#### flat

```ts
P.flat(parser);
```

#### flatMap

```ts
P.flatMap(node => node)(parser);
```

#### unit

```ts
P.unit(parser);
```

#### pick

```ts
P.pick(0)(parser);
```

#### lazy

```ts
const lazy = P.lazy();
const p = lazy.getParser();
lazy.setParser(parser);
```

#### log

```ts
P.log("test")(parser);
```

#### debug

```ts
P.debug({ type: "test" })(parser);
```
