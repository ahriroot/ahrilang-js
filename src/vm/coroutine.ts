import { InstType } from '../instruction'
import {
    ErrorRuntime,
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
    ObjectError,
    ObjectFuture,
    ObjectInteger,
    ObjectMap,
    ObjectNull,
} from '../object'
import { Frame } from './frame'
import { Runtime } from './runtime'
import { print, thread, coroutine } from './builtin'
import { import_std } from './standard'

type Obj = ObjectBase | Promise<ObjectBase> | undefined

class AsyncFrame {
    runtime: Runtime
    parent: AsyncFrame | null
    consts: ObjectConsts
    names: ObjectNames
    instructions: ObjectInstructions
    locals: { [x: number]: Obj }
    stack: Obj[]
    depth: number
    global: { [x: number]: Obj }

    constructor(
        runtime: Runtime,
        parent: AsyncFrame | null,
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

    async run(args: ObjectBase | null): Promise<ObjectBase> {
        let instructions = this.instructions.value
        let a
        let b
        let point = 0
        while (true) {
            if (point >= instructions.length) {
                break
            }
            let inst = instructions[point]
            let index = inst.index
            switch (inst.inst_type) {
                case InstType.Use:
                    let path = this.stack.pop() as ObjectString
                    this.stack.push(import_std(new ObjectArray([path])))
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
                        return new ObjectError(new ErrorRuntime('No name'))
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
                case InstType.StoreFast:
                    let argums = (args as ObjectArray).value
                    let obj = this.stack.pop() as ObjectBase
                    argums[index] = obj
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
                        null,
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
                        this,
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
                            let res = standard.value(
                                ars,
                                this.runtime,
                            ) as ObjectBase
                            if (res instanceof Promise) {
                                res = await res
                            }
                            this.stack.push(res)
                        } else {
                            throw new ErrorRuntime('Not implemented yet')
                        }
                    } else {
                        throw new ErrorRuntime('Function not found')
                    }
                    break
                case InstType.Await:
                    let future = this.stack.pop() as ObjectFuture
                    if (future.type == 'ObjectFuture') {
                        let result = await future.value
                        this.stack.push(result)
                    } else {
                        throw new ErrorRuntime('await must be used for future')
                    }
                    break
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
                    point = index
                    continue
                case InstType.JumpFalse:
                    let condition = this.stack.pop() as ObjectBoolean
                    if (!condition.value) {
                        point = index
                        continue
                    }
                    break
                case InstType.Pop:
                    this.stack.pop()
                    break
                case InstType.Return:
                    let ret = this.stack.pop() as ObjectBase
                    return ret
                case InstType.BuildList:
                    let list = []
                    for (let i = 0; i < index; i++) {
                        list.unshift(this.stack.pop() as ObjectBase)
                    }
                    this.stack.push(new ObjectArray(list))
                    break
                case InstType.BuildMap:
                    let map = new Map()
                    for (let i = 0; i < index; i++) {
                        let value = this.stack.pop() as ObjectBase
                        let key = this.stack.pop() as ObjectBase
                        map.set(key, value)
                    }
                    this.stack.push(new ObjectMap(map))
                    break
                case InstType.BuildSlice:
                    let slice = []
                    for (let i = 0; i < index; i++) {
                        slice.unshift(this.stack.pop() as ObjectBase)
                    }
                    this.stack.push(new ObjectArray(slice))
                    break
                case InstType.BinarySubscript:
                    b = this.stack.pop() as ObjectArray
                    a = this.stack.pop() as ObjectBase
                    if (b.value.length == 1) {
                        let i
                        switch (a.type) {
                            case 'ObjectArray':
                                i = (b.value[0] as ObjectInteger).value
                                this.stack.push((a as ObjectArray).value[i])
                                break
                            case 'ObjectMap':
                                i = b.value[0]
                                this.stack.push((a as ObjectMap).get(i))
                                break
                            case 'ObjectString':
                                i = (b.value[0] as ObjectInteger).value
                                this.stack.push(
                                    new ObjectString(
                                        (a as ObjectString).value[i],
                                    ),
                                )
                                break
                            default:
                                throw new ErrorRuntime('Not implemented yet')
                        }
                    } else if (b.value.length == 2) {
                        let start = (b.value[0] as ObjectInteger).value
                        let end = (b.value[1] as ObjectInteger).value
                        switch (a.type) {
                            case 'ObjectArray':
                                this.stack.push(
                                    new ObjectArray(
                                        (a as ObjectArray).value.slice(
                                            start,
                                            end,
                                        ),
                                    ),
                                )
                                break
                            case 'ObjectString':
                                this.stack.push(
                                    new ObjectString(
                                        (a as ObjectString).value.slice(
                                            start,
                                            end,
                                        ),
                                    ),
                                )
                                break
                            default:
                                throw new ErrorRuntime('Not implemented yet')
                        }
                    }
                    break
                case InstType.StoreSubscript:
                    b = this.stack.pop() as ObjectArray
                    a = this.stack.pop() as ObjectBase

                    switch (a.type) {
                        case 'ObjectArray':
                            ;(a as ObjectArray).value[
                                (b.value[0] as ObjectInteger).value
                            ] = this.stack.pop() as ObjectBase
                            break
                        case 'ObjectMap':
                            ;(a as ObjectMap).set(
                                b.value[0],
                                this.stack.pop() as ObjectBase,
                            )
                            break
                        default:
                            throw new ErrorRuntime('Not implemented yet')
                    }
                    break
            }
            point++
        }
        return new ObjectNull()
    }
}

export { AsyncFrame }
