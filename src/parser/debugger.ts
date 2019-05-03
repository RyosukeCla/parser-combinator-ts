import { Parser, State } from './core'

export interface DebugProcess {
  type: string,
}

interface DebuggerState extends DebugProcess {
  state: State<{}>
}

class DebuggerNode {
  children: DebuggerNode[]
  parent: DebuggerNode | null
  value: DebuggerState

  constructor(value: DebugProcess) {
    this.children = []
    this.parent = null
    this.value = {
      ...value,
      state: {} as any
    }
  }

  setParent(parent: DebuggerNode) {
    this.parent = parent
  }

  addChild(child: DebuggerNode) {
    this.children.push(child)
  }

  getParent() {
    return this.parent
  }

  assignState(state: State<{}>) {
    Object.assign(this.value, {
      state
    })
  }

  getChildrensSuccess(): boolean[] {
    return this.children.map(child => child.value.state.success)
  }

  isSuccess() {
    return this.value.state.success
  }

  isLeaf() {
    return this.children.length === 0
  }

  isRoot() {
    return !!this.parent
  }
}

class Debugger {
  private graph?: DebuggerNode
  private cursor: DebuggerNode

  constructor() {
    this.cursor = new DebuggerNode({} as any)
  }

  clear() {
    this.graph = undefined
  }

  analyze() {
    if (!this.graph) return
    console.log(this.recursivelyAnalyze(this.graph, '', true, true))
  }

  private recursivelyAnalyze(graph: DebuggerNode, indent: string, isLast: boolean, isRoot: boolean): string {
    let res = ""
    let nextDepth = indent
    if (!isRoot) {
      res += nextDepth
      if (isLast) {
        res += "`- "
        nextDepth += "   "
      } else {
        res += "|- "
        nextDepth += "|  "
      }
    }

    const isSuccess = graph.isSuccess()
    if (!isSuccess) {
      res += `${isSuccess ? 'S' : 'F'} ${graph.value.type} - p: ${graph.value.state.position}`
      const lastIndex = graph.children.length - 1
      graph.children.forEach((child, i) => {
        res += '\n'
        res += this.recursivelyAnalyze(child, nextDepth, i === lastIndex, false)
      })
    } else {
      res += `${isSuccess ? 'S' : 'F'} ${graph.value.type} - p: ${graph.value.state.position}`
    }

    return res
  }

  grow(process: DebugProcess) {
    if (!this.graph) {
      this.graph = new DebuggerNode(process)
      this.cursor = this.graph
    } else {
      const node = new DebuggerNode(process)
      this.cursor.addChild(node)
      node.setParent(this.cursor)
      this.cursor = node
    }
  }

  assign(state: State<{}>) {
    this.cursor.assignState(state)
  }

  back() {
    const parent = this.cursor.getParent()
    if (!parent) return
    this.cursor = parent
  }
}

export const _DEBUGGER_ = new Debugger()

export const debug = (process: DebugProcess) => <A>(parser: Parser<A>): Parser<A> => {
  return target => position => {
    _DEBUGGER_.grow(process)
    const parsed = parser(target)(position)
    _DEBUGGER_.assign(parsed)
    _DEBUGGER_.back()
    return parsed
  }
}