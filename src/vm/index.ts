export { AsyncFrame } from './coroutine'
export { Frame } from './frame'
export { Runtime } from './runtime'

import { Compiler } from '../lib'
import {
    ObjectAsyncFrame,
    ObjectBase,
    ObjectConsts,
    ObjectError,
    ObjectInstructions,
    ObjectNames,
    ObjectNull,
} from '../object'
import { Parser } from '../parse'
import { Lexer } from '../token'
import { AsyncFrame } from './coroutine'
import { Runtime } from './runtime'

class VirtualMachine {
    frame: AsyncFrame
    runtime: Runtime

    constructor(frame: AsyncFrame, runtime: Runtime) {
        this.frame = frame
        this.runtime = runtime
    }

    static async execute(
        bytecode: Uint8Array,
        args: string[],
        builtins?: { [x: string]: any },
    ): Promise<ObjectBase> {
        let code = new Uint8Array(bytecode.buffer, 8)
        let codeString = new TextDecoder().decode(code)
        let codeObject = ObjectBase.from(
            JSON.parse(codeString),
        ) as ObjectAsyncFrame
        let frame = codeObject.value
        let runtime = new Runtime(args, builtins)
        frame.runtime = runtime

        let vm = new VirtualMachine(frame, new Runtime(args))
        try {
            return await vm.run()
        } catch (error: any) {
            let message = error.message
            console.log('\x1b[31m' + message + '\x1b[0m')
        }
        return new ObjectNull()
    }

    static async interpret(
        code: string,
        args: string[],
        builtins?: { [x: string]: any },
    ): Promise<ObjectBase> {
        let lexer = new Lexer(code)

        let parser = new Parser(lexer)
        let expression = parser.parse()

        let compiler = new Compiler([], [])
        let [consts, names, instructions] = compiler.compile(expression)

        let runtime = new Runtime(args, builtins)

        let frame = new AsyncFrame(
            runtime,
            null,
            new ObjectConsts(consts),
            new ObjectNames(names),
            new ObjectInstructions(instructions),
            0,
            {},
        )

        let vm = new VirtualMachine(frame, runtime)
        try {
            return await vm.run()
        } catch (error: any) {
            let message = error.message
            console.log('\x1b[31m' + message + '\x1b[0m')
        }
        return new ObjectNull()
    }

    static async eval(
        code: string,
        args: string[],
        builtins?: { [x: string]: any },
    ): Promise<ObjectBase> {
        let lexer = new Lexer(code)

        let parser = new Parser(lexer)
        let expression = parser.parse()

        let compiler = new Compiler([], [])
        let [consts, names, instructions] = compiler.compile(expression)

        let runtime = new Runtime(args, builtins)

        let frame = new AsyncFrame(
            runtime,
            null,
            new ObjectConsts(consts),
            new ObjectNames(names),
            new ObjectInstructions(instructions),
            0,
            {},
        )

        let vm = new VirtualMachine(frame, runtime)
        return await vm.run()
    }

    async run(): Promise<ObjectBase> {
        let res = await this.frame.run(null)
        if (res.type == 'ObjectError') {
            let r = res as ObjectError
            throw r.value
        }
        return new ObjectNull()
    }
}

export { VirtualMachine }
