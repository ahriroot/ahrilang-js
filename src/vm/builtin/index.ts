import {
    ObjectArray,
    ObjectAsyncFrame,
    ObjectBase,
    ObjectFuture,
    ObjectNull,
} from '../../object'
import { Runtime } from '../runtime'

const print = (args: ObjectBase, runtime?: Runtime): ObjectBase => {
    let argument = args as ObjectArray
    const cl = runtime?.builtins?.print
    if (cl) {
        cl(argument.value[0].toString())
    } else {
        console.log(argument.value[0].toString())
    }
    return new ObjectNull()
}

const thread = (args: ObjectBase, _runtime?: Runtime): ObjectBase => {
    let argument = args as ObjectArray
    let func = argument.value[0] as ObjectAsyncFrame
    let future = func.value.run(null)
    return new ObjectFuture(future)
}

const coroutine = async (args: ObjectBase, _runtime?: Runtime): Promise<ObjectBase> => {
    let argument = args as ObjectArray
    let frame = argument.value[0] as ObjectFuture
    let res = await frame.value
    return res
}

export { print, thread, coroutine }
