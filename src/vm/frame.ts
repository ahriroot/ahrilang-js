import { InstType } from '../instruction'
import {
    ErrorRuntime,
    ErrorSyntax,
    ObjectBase,
    ObjectConsts,
    ObjectFrame,
    ObjectInstructions,
    ObjectNames,
    ObjectStd,
    ObjectString,
    StdFunction,
} from '../lib'
import {
    ObjectArray,
    ObjectAsyncFrame,
    ObjectBoolean,
    ObjectFuture,
    ObjectNull,
} from '../object'
import { AsyncFrame } from './coroutine'
import { Runtime } from './runtime'
import { print, thread, coroutine } from './std'

type Obj = ObjectBase | Promise<ObjectBase> | undefined

class Frame {
    runtime: Runtime
    parent: Frame | null
    consts: ObjectConsts
    names: ObjectNames
    instructions: ObjectInstructions
    locals: { [x: number]: Obj }
    stack: Obj[]
    depth: number
    global: { [x: number]: Obj }

    constructor(
        runtime: Runtime,
        parent: Frame | null,
        consts: ObjectConsts,
        names: ObjectNames,
        instructions: ObjectInstructions,
        depth: number,
        global: { [x: number]: Obj },
    ) {
        this.runtime = runtime
        this.parent = parent
        this.consts = consts
        this.names = names
        this.instructions = instructions
        this.locals = {}
        this.stack = []
        this.depth = depth
        this.global = global
    }

    hash(): symbol {
        return Symbol.for('frame')
    }

    run(args: ObjectBase | null): ObjectBase {
        let instructions = this.instructions.value
        let a
        let b
        for (let i = 0; i < instructions.length; i++) {
            let inst = instructions[i]
            let index = inst.index
            switch (inst.inst_type) {
                case InstType.Use:
                    // TODO: import module
                    break
                case InstType.LoadStd:
                    if (index == 0) {
                        this.stack.push(new ObjectStd(new StdFunction(print)))
                    } else if (index == 1) {
                        this.stack.push(new ObjectStd(new StdFunction(thread)))
                    } else if (index == 2) {
                        this.stack.push(
                            new ObjectStd(new StdFunction(coroutine)),
                        )
                    }
                    break
                case InstType.LoadConst:
                    this.stack.push(this.consts.value[index])
                    break
                case InstType.StoreName:
                    this.locals[index] = this.stack.pop()
                    break
                case InstType.LoadName:
                    if (index in this.locals) {
                        this.stack.push(this.locals[index])
                    } else {
                        let argus = (args as ObjectArray).value
                        if (argus.length > index) {
                            this.stack.push(argus[index])
                        } else {
                            throw new ErrorRuntime('No argument')
                        }
                    }
                    break
                case InstType.LoadGlobal:
                    if (index in this.global) {
                        this.stack.push(this.global[index])
                    } else {
                        throw new ErrorRuntime('No global variable')
                    }
                    break
                case InstType.StoreGlobal:
                    break
                case InstType.LoadFast:
                    let argus = (args as ObjectArray).value
                    if (argus.length > index) {
                        this.stack.push(argus[index])
                    } else {
                        throw new ErrorRuntime('No argument')
                    }
                    break
                case InstType.BinaryAdd:
                    b = this.stack.pop() as ObjectBase
                    a = this.stack.pop() as ObjectBase
                    this.stack.push(a.add(b))
                    break
                case InstType.BinarySub:
                    b = this.stack.pop() as ObjectBase
                    a = this.stack.pop() as ObjectBase
                    this.stack.push(a.sub(b))
                    break
                case InstType.BinaryMul:
                    b = this.stack.pop() as ObjectBase
                    a = this.stack.pop() as ObjectBase
                    this.stack.push(a.mul(b))
                    break
                case InstType.BinaryDiv:
                    b = this.stack.pop() as ObjectBase
                    a = this.stack.pop() as ObjectBase
                    this.stack.push(a.div(b))
                    break
                case InstType.BinaryMod:
                    b = this.stack.pop() as ObjectBase
                    a = this.stack.pop() as ObjectBase
                    this.stack.push(a.mod(b))
                    break
                case InstType.FormatValue:
                    a = this.stack.pop() as ObjectBase
                    this.stack.push(new ObjectString(a.format()))
                    break
                case InstType.BuildString:
                    let res = ''
                    for (let i = index; i >= 0; i--) {
                        res += (this.stack.pop() as ObjectString).value
                    }
                    this.stack.push(new ObjectString(res))
                    break
                case InstType.MakeFunction:
                    let insts = this.stack.pop() as ObjectInstructions
                    let names = this.stack.pop() as ObjectNames
                    let consts = this.stack.pop() as ObjectConsts
                    let frame = new Frame(
                        this.runtime,
                        this,
                        consts,
                        names,
                        insts,
                        this.depth + 1,
                        this.locals,
                    )
                    this.stack.push(new ObjectFrame(frame))
                    break
                case InstType.MakeAsyncFunction:
                    let insts_async = this.stack.pop() as ObjectInstructions
                    let names_async = this.stack.pop() as ObjectNames
                    let consts_async = this.stack.pop() as ObjectConsts
                    let frame_async = new AsyncFrame(
                        this.runtime,
                        null,
                        consts_async,
                        names_async,
                        insts_async,
                        this.depth + 1,
                        this.locals,
                    )
                    this.stack.push(new ObjectAsyncFrame(frame_async))
                    break
                case InstType.CallFunction:
                    let func = this.stack.pop() as
                        | ObjectFrame
                        | ObjectAsyncFrame
                    let as = []
                    for (let i = 0; i < index; i++) {
                        as.push(this.stack.pop() as ObjectBase)
                    }
                    let ars = new ObjectArray(as)

                    if (func.type == 'ObjectFrame') {
                        let frame = func as ObjectFrame
                        this.stack.push(frame.value.run(ars))
                    } else if (func.type == 'ObjectAsyncFrame') {
                        let frame = func as ObjectAsyncFrame
                        this.stack.push(new ObjectFuture(frame.value.run(ars)))
                    } else if (func.type == 'ObjectStd') {
                        let std = (func as unknown as ObjectStd).value
                        if (std.type == 'StdFunction') {
                            let standard = std as StdFunction
                            this.stack.push(standard.value(ars, this.runtime))
                        } else {
                            throw new ErrorRuntime('Not implemented yet')
                        }
                    } else {
                        throw new ErrorRuntime('Function not found')
                    }
                    break
                case InstType.Await:
                    throw new ErrorSyntax("'await' outside async function")
                case InstType.Compare:
                    b = this.stack.pop() as ObjectBase
                    a = this.stack.pop() as ObjectBase
                    if (index == 0) {
                        this.stack.push(a.equal(b))
                    } else if (index == 1) {
                        this.stack.push(a.notEqual(b))
                    } else if (index == 2) {
                        this.stack.push(a.greaterThan(b))
                    } else if (index == 3) {
                        this.stack.push(a.lessThan(b))
                    } else if (index == 4) {
                        this.stack.push(a.greaterThanOrEqual(b))
                    } else if (index == 5) {
                        this.stack.push(a.lessThanOrEqual(b))
                    }
                    break
                case InstType.Jump:
                    i = index
                    continue
                case InstType.JumpFalse:
                    let condition = this.stack.pop() as ObjectBoolean
                    if (!condition.value) {
                        i = index
                        continue
                    }
                case InstType.Pop:
                    this.stack.pop()
                    break
                case InstType.Return:
                    let ret = this.stack.pop() as ObjectBase
                    return ret
            }
        }
        return new ObjectNull()
    }
}

export { Frame }
