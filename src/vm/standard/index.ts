import { Compiler } from '../../compile'
import { ErrorBase } from '../../error'
import {
    ObjectArray,
    ObjectBase,
    ObjectInstructions,
    ObjectNull,
    ObjectStd,
    ObjectString,
    StdFunction,
} from '../../object'
import { Parser } from '../../parse'
import { Lexer } from '../../token'
import { Runtime } from '../runtime'

const parse = (args: ObjectBase, _runtime?: Runtime): ObjectBase => {
    let argument = args as ObjectArray
    let codeObjedt = argument.value[0] as ObjectString
    let code = codeObjedt.value

    let lexer = new Lexer(code)
    let parser = new Parser(lexer)
    let compiler = new Compiler([], [])

    let [_consts, _names, instructions] = compiler.compile(parser.parse())

    return new ObjectInstructions(instructions)
}

const display = (args: ObjectBase, _runtime?: Runtime): ObjectBase => {
    let argument = args as ObjectArray
    let instructionsObjedt = argument.value[0] as ObjectInstructions
    let instructions = instructionsObjedt.value

    console.log(instructions.map((i) => i.toString()).join('\n'))
    return new ObjectNull()
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
            default:
                throw new ErrorBase('Invalid import path')
        }
    } else {
        throw new ErrorBase('Not supported yet')
    }
}

export { import_std }
