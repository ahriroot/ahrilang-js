export { AsyncFrame } from './coroutine'
export { Frame } from './frame'
export { Runtime } from './runtime'

import { Compiler } from '../lib'
import {
    ObjectAsyncFrame,
    ObjectBase,
    ObjectConsts,
    ObjectInstructions,
    ObjectNames,
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

    static execute(
        bytecode: Uint8Array,
        args: string[],
        builtins?: { [x: string]: any },
    ) {
        let code = new Uint8Array(bytecode.buffer, 8)
        let codeString = new TextDecoder().decode(code)
        let codeObject = ObjectBase.from(
            JSON.parse(codeString),
        ) as ObjectAsyncFrame
        let frame = codeObject.value
        let runtime = new Runtime(args, builtins)
        frame.runtime = runtime

        let vm = new VirtualMachine(frame, new Runtime(args))
        vm.run()
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
        return vm.run()
    }

    async run(): Promise<ObjectBase> {
        let res = this.frame.run(null)
        return res
    }
}

export { VirtualMachine }
