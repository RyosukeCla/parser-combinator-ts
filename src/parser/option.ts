import { Parser, none } from './core'
import { debug, DebugProcess } from './debugger'

const _DEBUG_PROCESS: DebugProcess = {
  type: 'option'
}

const combinator = <A>(parser: Parser<A>): Parser<A> => {
  return debug(_DEBUG_PROCESS)(target => position => {
    const parsed = parser(target)(position)
    if (parsed.success) {
      return parsed
    } else {
      return {
        success: true,
        node: none,
        position: position
      }
    }
  })
}

export default combinator