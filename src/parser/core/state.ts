import { PNode } from "./pnode";

export interface State<A> {
  success: boolean;
  node: PNode<A>;
  position: number;
}

export type Parser<A = {}> = (target: string) => (position: number) => State<A>;
