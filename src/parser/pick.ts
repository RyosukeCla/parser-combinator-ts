import { Parser } from './core'
import { debug, DebugProcess } from './debugger'

const _DEBUG_PROCESS: DebugProcess = {
  type: 'pick'
}

const combinator = (index: number) => <A>(parser: Parser<A>): Parser<A> => {
  return debug(_DEBUG_PROCESS)(target => position => {
    const parsed = parser(target)(position)
    
    if (parsed.success) {
      return {
        success: true,
        node: parsed.node.pick(index),
        position: parsed.position
      }
    } else {
      return parsed
    }
  })
}

export default combinator