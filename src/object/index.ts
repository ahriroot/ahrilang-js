import { ErrorBase, ErrorRuntime } from '../error'
import { Instruction } from '../instruction'
import { Expression } from '../parse'
import { AsyncFrame, Frame, Runtime } from '../vm'

class Standard {
    type = 'Standard'
    hash(): symbol {
        return Symbol.for(this.toString())
    }
}

type Function = (
    obj: ObjectBase,
    runtime?: Runtime,
) => ObjectBase | Promise<ObjectBase>

class StdFunction extends Standard {
    value: Function
    type = 'StdFunction'

    constructor(value: Function) {
        super()
        this.value = value
    }
}

class StdThread extends Standard {
    value: Promise<ObjectBase>
    type = 'StdThread'

    constructor(value: Promise<ObjectBase>) {
        super()
        this.value = value
    }
}

class StdCoroutine extends Standard {
    value: Promise<ObjectBase>
    type = 'StdCoroutine'

    constructor(value: Promise<ObjectBase>) {
        super()
        this.value = value
    }
}

class ObjectBase {
    type = 'ObjectBase'
    id: string

    constructor() {
        this.id = Math.random().toString().substring(2, 15)
    }

    toString(): string {
        return `<${this.type.substring(6)} id='${this.id}'>`
    }

    hash(): symbol {
        return Symbol.for(this.id)
    }

    format(): string {
        throw new Error('Method not implemented.')
    }

    equal(other: ObjectBase): ObjectBase {
        throw new Error('Method not implemented.')
    }

    notEqual(other: ObjectBase): ObjectBase {
        throw new Error('Method not implemented.')
    }

    greaterThan(other: ObjectBase): ObjectBase {
        throw new Error('Method not implemented.')
    }

    greaterThanOrEqual(other: ObjectBase): ObjectBase {
        throw new Error('Method not implemented.')
    }

    lessThan(other: ObjectBase): ObjectBase {
        throw new Error('Method not implemented.')
    }

    lessThanOrEqual(other: ObjectBase): ObjectBase {
        throw new Error('Method not implemented.')
    }

    add(other: ObjectBase): ObjectBase {
        if (this.type == 'ObjectInteger' && other.type == 'ObjectInteger') {
            let a = this as unknown as ObjectInteger
            let b = other as unknown as ObjectInteger
            return new ObjectInteger(a.value + b.value)
        }
        if (this.type == 'ObjectFloat' && other.type == 'ObjectFloat') {
            let a = this as unknown as ObjectFloat
            let b = other as unknown as ObjectFloat
            return new ObjectFloat(a.value + b.value)
        }
        throw new Error('Invalid operation')
    }

    sub(other: ObjectBase): ObjectBase {
        if (this.type == 'ObjectInteger' && other.type == 'ObjectInteger') {
            let a = this as unknown as ObjectInteger
            let b = other as unknown as ObjectInteger
            return new ObjectInteger(a.value - b.value)
        }
        if (this.type == 'ObjectFloat' && other.type == 'ObjectFloat') {
            let a = this as unknown as ObjectFloat
            let b = other as unknown as ObjectFloat
            return new ObjectFloat(a.value - b.value)
        }
        throw new Error('Invalid operation')
    }

    mul(other: ObjectBase): ObjectBase {
        if (this.type == 'ObjectInteger' && other.type == 'ObjectInteger') {
            let a = this as unknown as ObjectInteger
            let b = other as unknown as ObjectInteger
            return new ObjectInteger(a.value * b.value)
        }
        if (this.type == 'ObjectFloat' && other.type == 'ObjectFloat') {
            let a = this as unknown as ObjectFloat
            let b = other as unknown as ObjectFloat
            return new ObjectFloat(a.value * b.value)
        }
        throw new Error('Invalid operation')
    }

    div(other: ObjectBase): ObjectBase {
        if (this.type == 'ObjectInteger' && other.type == 'ObjectInteger') {
            let a = this as unknown as ObjectInteger
            let b = other as unknown as ObjectInteger
            return new ObjectInteger(a.value / b.value)
        }
        if (this.type == 'ObjectFloat' && other.type == 'ObjectFloat') {
            let a = this as unknown as ObjectFloat
            let b = other as unknown as ObjectFloat
            return new ObjectFloat(a.value / b.value)
        }
        throw new Error('Invalid operation')
    }

    mod(other: ObjectBase): ObjectBase {
        if (this.type == 'ObjectInteger' && other.type == 'ObjectInteger') {
            let a = this as unknown as ObjectInteger
            let b = other as unknown as ObjectInteger
            return new ObjectInteger(a.value % b.value)
        }
        throw new Error('Invalid operation')
    }

    to(): { [x: string]: any } {
        let v
        switch (this.type) {
            case 'ObjectInteger':
                v = this as unknown as ObjectInteger
                return { t: 1, v: v.value }
            case 'ObjectFloat':
                v = this as unknown as ObjectFloat
                return { t: 2, v: v.value }
            case 'ObjectComplex':
                v = this as unknown as ObjectComplex
                return { t: 3, v: [v.real, v.imaginary] }
            case 'ObjectBoolean':
                v = this as unknown as ObjectBoolean
                return { t: 4, v: v.value }
            case 'ObjectString':
                v = this as unknown as ObjectString
                return { t: 5, v: v.value }
            case 'ObjectNull':
                v = this as unknown as ObjectNull
                return { t: 6, v: null }
            case 'ObjectArray':
                v = this as unknown as ObjectArray
                return { t: 7, v: v.value.map((v: ObjectBase) => v.to()) }
            case 'ObjectMap':
                v = this as unknown as ObjectMap
                return { t: 8, v: v.value }
            case 'ObjectError':
                v = this as unknown as ObjectError
                return { t: 9, v: v.value }
            case 'ObjectConsts':
                v = this as unknown as ObjectConsts
                return { t: 10, v: v.value.map((v: ObjectBase) => v.to()) }
            case 'ObjectNames':
                v = this as unknown as ObjectNames
                return { t: 11, v: v.value.map((v: ObjectBase) => v.to()) }
            case 'ObjectInstructions':
                v = this as unknown as ObjectInstructions
                return { t: 12, v: v.value.map((v: Instruction) => v.to()) }
            case 'ObjectFrame':
                v = this as unknown as ObjectFrame
                let consts: any = v.value.consts.value.map((v: ObjectBase) =>
                    v.to(),
                )
                let names: any = v.value.names.value.map((v: ObjectBase) =>
                    v.to(),
                )
                let instructions: any = v.value.instructions.value.map(
                    (v: Instruction) => v.to(),
                )
                return {
                    t: 13,
                    v: {
                        c: consts,
                        n: names,
                        i: instructions,
                    },
                }
            case 'ObjectAsyncFrame':
                v = this as unknown as ObjectAsyncFrame
                let consts_async: any = v.value.consts.value.map(
                    (v: ObjectBase) => v.to(),
                )
                let names_async: any = v.value.names.value.map(
                    (v: ObjectBase) => v.to(),
                )
                let instructions_async: any = v.value.instructions.value.map(
                    (v: Instruction) => v.to(),
                )
                return {
                    t: 14,
                    v: {
                        c: consts_async,
                        n: names_async,
                        i: instructions_async,
                    },
                }
            case 'ObjectExpression':
                v = this as unknown as ObjectExpression
                return { t: 15, v: v.value }
            default:
                throw new ErrorRuntime(`Type not found: ${this.type}`)
        }
    }

    static from(data: any): ObjectBase {
        let t: number = data.t
        let v = data.v
        switch (t) {
            case 1:
                return new ObjectInteger(v)
            case 2:
                return new ObjectFloat(v)
            case 3:
                return new ObjectComplex(v[0], v[1])
            case 4:
                return new ObjectBoolean(v)
            case 5:
                return new ObjectString(v)
            case 6:
                return new ObjectNull()
            case 7:
                return new ObjectArray(v.map((i: any) => ObjectBase.from(i)))
            case 8:
                return new ObjectMap(v)
            case 9:
                return new ObjectError(v)
            case 10:
                return new ObjectConsts(v.map((i: any) => ObjectBase.from(i)))
            case 11:
                return new ObjectNames(v.map((i: any) => ObjectBase.from(i)))
            case 12:
                return new ObjectInstructions(
                    v.map((i: any) => Instruction.from(i)),
                )
            case 13:
                let consts = v.c.map((i: any) => ObjectBase.from(i))
                let names = v.n.map((i: any) => ObjectBase.from(i))
                let instructions = v.i.map((i: any) => Instruction.from(i))
                let frame = new Frame(
                    new Runtime([]),
                    null,
                    new ObjectConsts(consts),
                    new ObjectNames(names),
                    new ObjectInstructions(instructions),
                    0,
                    {},
                )
                return new ObjectFrame(frame)
            case 14:
                let consts_async = v.c.map((i: any) => ObjectBase.from(i))
                let names_async = v.n.map((i: any) => ObjectBase.from(i))
                let instructions_async = v.i.map((i: any) =>
                    Instruction.from(i),
                )
                let frame_async = new AsyncFrame(
                    new Runtime([]),
                    null,
                    new ObjectConsts(consts_async),
                    new ObjectNames(names_async),
                    new ObjectInstructions(instructions_async),
                    0,
                    {},
                )
                return new ObjectAsyncFrame(frame_async)
            case 15:
                return new ObjectExpression(v)
            default:
                throw new ErrorRuntime(`Type not found: ${t}`)
        }
    }

    toJSON(): string {
        let self
        switch (this.type) {
            case 'ObjectInteger':
                self = this as unknown as ObjectInteger
                return `Integer(${self.value})`
            case 'ObjectFloat':
                self = this as unknown as ObjectFloat
                return `Float(${self.value})`
            case 'ObjectComplex':
                self = this as unknown as ObjectComplex
                return `Complex(${self.real},${self.imaginary})`
            case 'ObjectBoolean':
                self = this as unknown as ObjectBoolean
                return `Boolean(${self.value})`
            case 'ObjectString':
                self = this as unknown as ObjectString
                return `String(${self.value})`
            case 'ObjectNull':
                return 'Null'
            case 'ObjectArray':
                self = this as unknown as ObjectArray
                return `Array([${self.value.map((v) => v.toJSON()).join(',')}])`
            case 'ObjectMap':
                self = this as unknown as ObjectMap
                return `Map(${self.value})`
            case 'ObjectError':
                self = this as unknown as ObjectError
                return `Error(${self.value})`
            case 'ObjectConsts':
                self = this as unknown as ObjectConsts
                return `Consts([${self.value
                    .map((v) => v.toJSON())
                    .join(',')}])`
            case 'ObjectNames':
                self = this as unknown as ObjectNames
                return `Names([${self.value.map((v) => v.toJSON()).join(',')}])`
            case 'ObjectInstructions':
                self = this as unknown as ObjectInstructions
                return `Instructions([${self.value
                    .map((v) => v.toString())
                    .join(',')}])`
            case 'ObjectFrame':
                self = this as unknown as ObjectFrame
                return `Frame(${self.value})`
            case 'ObjectAsyncFrame':
                self = this as unknown as ObjectAsyncFrame
                return `AsyncFrame(${self.value})`
            case 'ObjectExpression':
                self = this as unknown as ObjectExpression
                return `Expression(${self.value})`
            case 'ObjectStd':
                return 'Std'
            case 'ObjectFuture':
                self = this as unknown as ObjectFuture
                return `Future(${self.value})`
            default:
                throw new ErrorRuntime(`Type not found: ${this.type}`)
        }
    }
}

class ObjectInteger extends ObjectBase {
    value: number
    type = 'ObjectInteger'

    constructor(value: number) {
        super()
        this.value = value
    }

    toString(): string {
        return this.value.toString()
    }

    format(): string {
        return this.value.toString()
    }

    hash(): symbol {
        return Symbol.for(this.value.toString())
    }

    equal(other: ObjectBase): ObjectBase {
        let o
        switch (other.type) {
            case 'ObjectInteger':
                o = other as unknown as ObjectInteger
                return new ObjectBoolean(this.value === o.value)
            case 'ObjectFloat':
                o = other as unknown as ObjectFloat
                return new ObjectBoolean(this.value === o.value)
        }
        throw new Error('Invalid operation')
    }

    notEqual(other: ObjectBase): ObjectBase {
        let o
        switch (other.type) {
            case 'ObjectInteger':
                o = other as unknown as ObjectInteger
                return new ObjectBoolean(this.value !== o.value)
            case 'ObjectFloat':
                o = other as unknown as ObjectFloat
                return new ObjectBoolean(this.value !== o.value)
        }
        throw new Error('Invalid operation')
    }

    greaterThan(other: ObjectBase): ObjectBase {
        let o
        switch (other.type) {
            case 'ObjectInteger':
                o = other as unknown as ObjectInteger
                return new ObjectBoolean(this.value > o.value)
            case 'ObjectFloat':
                o = other as unknown as ObjectFloat
                return new ObjectBoolean(this.value > o.value)
        }
        throw new Error('Invalid operation')
    }

    lessThan(other: ObjectBase): ObjectBase {
        let o
        switch (other.type) {
            case 'ObjectInteger':
                o = other as unknown as ObjectInteger
                return new ObjectBoolean(this.value < o.value)
            case 'ObjectFloat':
                o = other as unknown as ObjectFloat
                return new ObjectBoolean(this.value < o.value)
        }
        throw new Error('Invalid operation')
    }

    greaterThanOrEqual(other: ObjectBase): ObjectBase {
        let o
        switch (other.type) {
            case 'ObjectInteger':
                o = other as unknown as ObjectInteger
                return new ObjectBoolean(this.value >= o.value)
            case 'ObjectFloat':
                o = other as unknown as ObjectFloat
                return new ObjectBoolean(this.value >= o.value)
        }
        throw new Error('Invalid operation')
    }

    lessThanOrEqual(other: ObjectBase): ObjectBase {
        let o
        switch (other.type) {
            case 'ObjectInteger':
                o = other as unknown as ObjectInteger
                return new ObjectBoolean(this.value <= o.value)
            case 'ObjectFloat':
                o = other as unknown as ObjectFloat
                return new ObjectBoolean(this.value <= o.value)
        }
        throw new Error('Invalid operation')
    }
}

class ObjectFloat extends ObjectBase {
    value: number
    type = 'ObjectFloat'

    constructor(value: number) {
        super()
        this.value = value
    }

    toString(): string {
        return this.value.toString()
    }

    format(): string {
        return this.value.toString()
    }

    hash(): symbol {
        return Symbol.for(this.value.toString())
    }

    equal(other: ObjectBase): ObjectBase {
        let o
        switch (other.type) {
            case 'ObjectInteger':
                o = other as unknown as ObjectInteger
                return new ObjectBoolean(this.value === o.value)
            case 'ObjectFloat':
                o = other as unknown as ObjectFloat
                return new ObjectBoolean(this.value === o.value)
        }
        throw new Error('Invalid operation')
    }

    notEqual(other: ObjectBase): ObjectBase {
        let o
        switch (other.type) {
            case 'ObjectInteger':
                o = other as unknown as ObjectInteger
                return new ObjectBoolean(this.value !== o.value)
            case 'ObjectFloat':
                o = other as unknown as ObjectFloat
                return new ObjectBoolean(this.value !== o.value)
        }
        throw new Error('Invalid operation')
    }

    greaterThan(other: ObjectBase): ObjectBase {
        let o
        switch (other.type) {
            case 'ObjectInteger':
                o = other as unknown as ObjectInteger
                return new ObjectBoolean(this.value > o.value)
            case 'ObjectFloat':
                o = other as unknown as ObjectFloat
                return new ObjectBoolean(this.value > o.value)
        }
        throw new Error('Invalid operation')
    }

    lessThan(other: ObjectBase): ObjectBase {
        let o
        switch (other.type) {
            case 'ObjectInteger':
                o = other as unknown as ObjectInteger
                return new ObjectBoolean(this.value < o.value)
            case 'ObjectFloat':
                o = other as unknown as ObjectFloat
                return new ObjectBoolean(this.value < o.value)
        }
        throw new Error('Invalid operation')
    }

    greaterThanOrEqual(other: ObjectBase): ObjectBase {
        let o
        switch (other.type) {
            case 'ObjectInteger':
                o = other as unknown as ObjectInteger
                return new ObjectBoolean(this.value >= o.value)
            case 'ObjectFloat':
                o = other as unknown as ObjectFloat
                return new ObjectBoolean(this.value >= o.value)
        }
        throw new Error('Invalid operation')
    }

    lessThanOrEqual(other: ObjectBase): ObjectBase {
        let o
        switch (other.type) {
            case 'ObjectInteger':
                o = other as unknown as ObjectInteger
                return new ObjectBoolean(this.value <= o.value)
            case 'ObjectFloat':
                o = other as unknown as ObjectFloat
                return new ObjectBoolean(this.value <= o.value)
        }
        throw new Error('Invalid operation')
    }
}

class ObjectComplex extends ObjectBase {
    real: number
    imaginary: number
    type = 'ObjectComplex'

    constructor(real: number, imaginary: number) {
        super()
        this.real = real
        this.imaginary = imaginary
    }

    toString(): string {
        return this.real.toString() + '+' + this.imaginary.toString() + 'j'
    }

    format(): string {
        return this.real.toString() + '+' + this.imaginary.toString() + 'j'
    }

    hash(): symbol {
        return Symbol.for(this.real.toString() + this.imaginary.toString())
    }
}

class ObjectBoolean extends ObjectBase {
    value: boolean
    type = 'ObjectBoolean'

    constructor(value: boolean) {
        super()
        this.value = value
    }

    toString(): string {
        return this.value.toString()
    }

    format(): string {
        return this.value.toString()
    }

    hash(): symbol {
        return Symbol.for(this.value.toString())
    }

    equal(other: ObjectBase): ObjectBase {
        let o
        switch (other.type) {
            case 'ObjectBoolean':
                o = other as unknown as ObjectBoolean
                return new ObjectBoolean(this.value === o.value)
        }
        throw new Error('Invalid operation')
    }

    notEqual(other: ObjectBase): ObjectBase {
        let o
        switch (other.type) {
            case 'ObjectBoolean':
                o = other as unknown as ObjectBoolean
                return new ObjectBoolean(this.value !== o.value)
        }
        throw new Error('Invalid operation')
    }
}

class ObjectString extends ObjectBase {
    value: string
    type = 'ObjectString'

    constructor(value: string) {
        super()
        this.value = value
    }

    toString(): string {
        return this.value
    }

    format(): string {
        return this.value
    }

    hash(): symbol {
        return Symbol.for(this.value)
    }
}

class ObjectNull extends ObjectBase {
    type = 'ObjectNull'

    constructor() {
        super()
    }

    toString(): string {
        return 'null'
    }

    format(): string {
        return 'null'
    }

    hash(): symbol {
        return Symbol.for('ahrilang-builtin-null-378q7w523')
    }
}

class ObjectArray extends ObjectBase {
    type = 'ObjectArray'
    value: ObjectBase[]

    constructor(value: ObjectBase[]) {
        super()
        this.value = value
    }

    toString(): string {
        return '[' + this.value.map((v) => v.toString()).join(', ') + ']'
    }

    format(): string {
        return '[' + this.value.map((v) => v.format()).join(',') + ']'
    }
}

class ObjectMap extends ObjectBase {
    keys: { [key: symbol]: ObjectBase }
    value: { [key: symbol]: ObjectBase }
    type = 'ObjectMap'

    constructor(value: { [key: string]: ObjectBase }) {
        super()
        this.keys = {}
        this.value = value
    }

    toString(): string {
        let tmp = []
        for (let k in this.value) {
            let key = k as unknown as symbol
            tmp.push(k + ': ' + this.value[key].toString())
        }
        return '{' + tmp.join(', ') + '}'
    }

    format(): string {
        let tmp = []
        for (let k in this.value) {
            let key = k as unknown as symbol
            tmp.push(k + ':' + this.value[key].format())
        }
        return '{' + tmp.join(',') + '}'
    }

    get(key: ObjectBase) {
        let k = key.hash()
        return this.value[k]
    }

    set(key: ObjectBase, value: ObjectBase) {
        let k = key.hash()
        this.keys[k] = key
        this.value[k] = value
    }
}

class ObjectError extends ObjectBase {
    value: ErrorBase
    type = 'ObjectError'

    constructor(value: ErrorBase) {
        super()
        this.value = value
    }

    format(): string {
        return this.value.message
    }
}

class ObjectConsts extends ObjectBase {
    value: ObjectBase[]
    type = 'ObjectConsts'

    constructor(value: ObjectBase[]) {
        super()
        this.value = value
    }

    format(): string {
        return '[' + this.value.map((v) => v.format()).join(',') + ']'
    }
}

class ObjectNames extends ObjectBase {
    value: ObjectBase[]
    type = 'ObjectNames'

    constructor(value: ObjectBase[]) {
        super()
        this.value = value
    }

    format(): string {
        return '[' + this.value.map((v) => v.format()).join(',') + ']'
    }
}

class ObjectInstructions extends ObjectBase {
    value: Instruction[]
    type = 'ObjectInstructions'

    constructor(value: Instruction[]) {
        super()
        this.value = value
    }

    format(): string {
        return '[' + this.value.map((v) => v.format()).join(',') + ']'
    }
}

class ObjectFrame extends ObjectBase {
    value: Frame
    type = 'ObjectFrame'

    constructor(value: Frame) {
        super()
        this.value = value
    }

    format(): string {
        return 'frame'
    }
}

class ObjectAsyncFrame extends ObjectBase {
    value: AsyncFrame
    type = 'ObjectAsyncFrame'

    constructor(value: AsyncFrame) {
        super()
        this.value = value
    }

    format(): string {
        return 'async_frame'
    }
}

class ObjectFuture extends ObjectBase {
    type = 'ObjectFuture'
    value: Promise<ObjectBase>

    constructor(value: Promise<ObjectBase>) {
        super()
        this.value = value
    }

    format(): string {
        return 'future'
    }
}

class ObjectExpression extends ObjectBase {
    value: Expression
    type = 'ObjectExpression'

    constructor(value: Expression) {
        super()
        this.value = value
    }

    format(): string {
        return 'expression'
    }
}

class ObjectStd extends ObjectBase {
    value: Standard
    type = 'ObjectStd'

    constructor(value: Standard) {
        super()
        this.value = value
    }

    format(): string {
        return 'std'
    }
}

export {
    Standard,
    StdFunction,
    StdThread,
    StdCoroutine,
    ObjectBase,
    ObjectInteger,
    ObjectFloat,
    ObjectComplex,
    ObjectBoolean,
    ObjectString,
    ObjectNull,
    ObjectArray,
    ObjectMap,
    ObjectError,
    ObjectConsts,
    ObjectNames,
    ObjectInstructions,
    ObjectFrame,
    ObjectAsyncFrame,
    ObjectFuture,
    ObjectExpression,
    ObjectStd,
}
