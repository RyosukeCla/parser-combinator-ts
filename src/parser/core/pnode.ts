export type PNode<A = {}> = None<A> | Value<A> | PNodes<A>;
export const URI = "PNode";

export type URI = typeof URI;

interface IPNodeMatch<A> {
  isNone: () => boolean;
  match: (matcher: PNodeMatcher<A> | PNodeMatcherDefault<A>) => void;
}

interface PNodeMatcherDefault<A> {
  (a: PNode<A>): void;
}

interface PNodeMatcher<A> {
  PNodes?: (a: PNodes<A>) => void;
  Value?: (a: Value<A>) => void;
  None?: (a: None<never>) => void;
  Default?: (a: PNode<A>) => void;
}

interface IPNodeMatchMap<A> {
  matchMap: <B>(mapper: PNodeMapper<A, B>) => PNode<B>;
}

export type PNodeMapper<A, B> =
  | PNodeMatchMapper<A, B>
  | PNodeMatchMapperDefault<A, B>;

interface PNodeMatchMapperDefault<A, B> {
  (a: PNode<A>): PNode<B>;
}

interface PNodeMatchMapper<A, B> {
  PNodes?: (a: PNodes<A>) => PNode<B>;
  Value?: (a: Value<A>) => PNode<B>;
  None?: (a: None<never>) => PNode<B>;
  Default?: (a: PNode<A>) => PNode<B>;
}

interface IPNode<A> {
  flat: () => PNode<A>;
  pick: (index: number) => PNode<A>;
}

export class PNodes<A = {}>
  implements IPNodeMatch<A>, IPNodeMatchMap<A>, IPNode<A> {
  readonly _URI: URI = URI;
  private items: Array<PNode<A>>;

  constructor(...items: Array<PNode<A>>) {
    this.items = items;
  }

  get length() {
    return this.items.length;
  }

  match(matcher: PNodeMatcher<A> | PNodeMatcherDefault<A>) {
    if (typeof matcher === "function") matcher(this);
    else if (matcher.PNodes) matcher.PNodes(this);
    else if (matcher.Default) matcher.Default(this);
    else throw new Error("error");
  }

  isNone() {
    return false;
  }

  matchMap<B>(mapper: PNodeMapper<A, B>): PNode<B> {
    if (typeof mapper === "function") return mapper(this);
    else if (mapper.PNodes) return mapper.PNodes(this);
    else if (mapper.Default) return mapper.Default(this);
    else throw new Error("error");
  }

  push(item: PNode<A>) {
    if (this.isNone()) return;
    this.items.push(item);
  }

  flat(): PNodes<A> {
    const result: Array<PNode<A>> = [];
    this.items.forEach(child => {
      child.match({
        PNodes(gchildren) {
          gchildren.forEach(gchild => {
            if (gchild.isNone()) return;
            result.push(gchild);
          });
        },
        Value(node) {
          result.push(node);
        },
        None() {}
      });
    });
    return new PNodes(...result);
  }

  forEach(
    callbackfn: (value: PNode<A>, index: number, array: PNode<A>[]) => void
  ) {
    this.items.forEach(callbackfn);
  }

  unwrap(): Array<PNode<A>> {
    return this.items;
  }

  pick(index: number): PNode<A> {
    return this.items[index] || None.value;
  }

  toString(): string {
    return recursiveFmt(this, "", true, true);
  }
}

interface PNodeArray<A> extends Array<PNode<A>> {
  _URI?: "Array";
}
export const nodes = <A>(a: PNode<A> | PNodeArray<A>): PNodes<A> => {
  if (a._URI === URI) {
    return new PNodes(a);
  } else {
    console.log(a);
    return new PNodes(...a);
  }
};

export class Value<A = {}> implements IPNodeMatch<A>, IPNode<A> {
  readonly _URI: URI = URI;

  constructor(readonly value: A) {}
  match(matcher: PNodeMatcher<A> | PNodeMatcherDefault<A>) {
    if (typeof matcher === "function") matcher(this);
    else if (matcher.Value) matcher.Value(this);
    else if (matcher.Default) matcher.Default(this);
    else throw new Error("error");
  }

  isNone() {
    return false;
  }

  matchMap<B>(mapper: PNodeMapper<A, B>): PNode<B> {
    if (typeof mapper === "function") return mapper(this);
    else if (mapper.Value) return mapper.Value(this);
    else if (mapper.Default) return mapper.Default(this);
    else throw new Error("error");
  }

  flat(): PNode<A> {
    return new Value(this.value);
  }

  map<B>(f: (a: A) => B): Value<B> {
    return new Value(f(this.value));
  }

  unwrap(): A {
    return this.value;
  }

  pick(index: number): PNode<A> {
    return this;
  }

  toString() {
    return `val(${JSON.stringify(this.value)}: ${typeof this.value})`;
  }
}

export const value = <A>(v: A): Value<A> => {
  return new Value<A>(v);
};

export class None<A = {}> implements IPNodeMatch<A>, IPNode<A> {
  readonly _URI: URI = URI;
  static value: PNode<never> = new None();
  private constructor() {}
  match(matcher: PNodeMatcher<A> | PNodeMatcherDefault<A>) {
    if (typeof matcher === "function") matcher(None.value);
    else if (matcher.None) matcher.None(None.value);
    else if (matcher.Default) matcher.Default(None.value);
    else throw new Error("error");
  }

  isNone() {
    return true;
  }

  matchMap<B>(mapper: PNodeMapper<A, B>): PNode<B> {
    if (typeof mapper === "function") return mapper(None.value);
    else if (mapper.None) return mapper.None(None.value);
    else if (mapper.Default) return mapper.Default(None.value);
    else return None.value;
  }

  flat(): PNode<A> {
    return None.value;
  }

  unwrap(): any {
    throw new Error("panic");
  }

  pick(index: number): PNode<A> {
    return None.value;
  }

  toString() {
    return "none";
  }
}

export const none = None.value;

function recursiveFmt(
  node: PNode<{}>,
  indent: string,
  isLast: boolean,
  isRoot: boolean
): string {
  let res = "";
  let nextDepth = indent;
  if (!isRoot) {
    res += nextDepth;
    if (isLast) {
      res += "`- ";
      nextDepth += "   ";
    } else {
      res += "|- ";
      nextDepth += "|  ";
    }
  }
  node.match({
    Default(value) {
      res += value.toString();
    },
    PNodes(nodes) {
      res += "node";
      const lastIndex = nodes.length - 1;
      nodes.forEach((node, i) => {
        res += "\n";
        res += recursiveFmt(node, nextDepth, i === lastIndex, false);
      });
    }
  });

  return res;
}
