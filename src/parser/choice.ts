import { Parser, none } from './core'
import { debug, DebugProcess } from './debugger'

const _DEBUG_PROCESS: DebugProcess = {
  type: 'choice'
}

const combinator = (...parsers: Array<Parser>): Parser => {
  return debug(_DEBUG_PROCESS)(target => posittion => {
    for (const parser of parsers) {
      const parsed = parser(target)(posittion);
      if (parsed.success) {
        return parsed
      }
    }

    return {
      success: false,
      node: none,
      position: posittion
    }
  })
}

export default combinator