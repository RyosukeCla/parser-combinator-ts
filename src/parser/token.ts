import { Parser, value, none } from './core'
import { debug, DebugProcess } from './debugger'

const _DEBUG_PROCESS = (token: string): DebugProcess => {
  return {
    type: `token: ${token}`
  }
}

const combinator = (token: string): Parser<string> => {
  return debug(_DEBUG_PROCESS(token))(target => position => {
    const nextPosition = position + token.length
    const sub = target.substring(position, nextPosition)
    if (sub === token) {
      return {
        success: true,
        node: value(token),
        position: nextPosition
      }
    } else {
      return {
        success: false,
        node: none,
        position: position
      }
    }
  })
}

export default combinator