import { Compiler } from '../../compile'
import { ErrorBase } from '../../error'
import {
    ObjectArray,
    ObjectBase,
    ObjectFuture,
    ObjectInstructions,
    ObjectInteger,
    ObjectStd,
    ObjectString,
    StdFunction,
} from '../../object'
import { Parser } from '../../parse'
import { Lexer } from '../../token'
import { Runtime } from '../runtime'

const parse = (args: ObjectBase, _runtime?: Runtime): ObjectBase => {
    let argument = args as ObjectArray
    let codeObject = argument.value[0] as ObjectString
    let code = codeObject.value

    let lexer = new Lexer(code)
    let parser = new Parser(lexer)
    let compiler = new Compiler([], [])

    let [_consts, _names, instructions] = compiler.compile(parser.parse())

    return new ObjectInstructions(instructions)
}

const display = (args: ObjectBase, _runtime?: Runtime): ObjectBase => {
    let argument = args as ObjectArray
    let instructionsObject = argument.value[0] as ObjectInstructions
    let instructions = instructionsObject.value

    return new ObjectString(instructions.map((i) => i.toString()).join('\n'))
}

const time_sleep = (args: ObjectBase, _runtime?: Runtime) => {
    let argument = args as ObjectArray
    let baseObject = argument.value[0]
    if (baseObject.type !== 'ObjectInteger') {
        throw new ErrorBase('Invalid argument')
    }
    let timeObject = baseObject as ObjectInteger
    let time = timeObject.value
    var timeStamp = new Date().getTime()
    var endTime = timeStamp + time
    while (true) {
        if (new Date().getTime() > endTime) {
            return
        }
    }
}

const async_time_sleep = (args: ObjectBase, _runtime?: Runtime): ObjectBase => {
    let argument = args as ObjectArray
    let baseObject = argument.value[0]
    if (baseObject.type !== 'ObjectInteger') {
        throw new ErrorBase('Invalid argument')
    }
    let timeObject = baseObject as ObjectInteger
    let time = timeObject.value
    return new ObjectFuture(new Promise((resolve) => setTimeout(resolve, time)))
}

const import_std = (args: ObjectBase, _runtime?: Runtime): ObjectBase => {
    let argument = args as ObjectArray
    let typeObject = argument.value[0] as ObjectString
    let type = typeObject.value

    if (type.startsWith('a.')) {
        switch (type) {
            case 'a.dis.parse':
                return new ObjectStd(new StdFunction(parse))
            case 'a.dis.display':
                return new ObjectStd(new StdFunction(display))
            case 'a.time.sleep':
                return new ObjectStd(new StdFunction(time_sleep))
            case 'a.coroutine.sleep':
                return new ObjectStd(new StdFunction(async_time_sleep))
            default:
                throw new ErrorBase('Invalid import path')
        }
    } else {
        throw new ErrorBase('Not supported yet')
    }
}

export { import_std }
