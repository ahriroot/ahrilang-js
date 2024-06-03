enum InstType {
    Use,
    LoadStd,
    LoadConst,
    LoadName,
    StoreName,
    LoadGlobal,
    StoreGlobal,
    LoadFast,
    StoreFast,
    BinaryAdd,
    BinarySub,
    BinaryMul,
    BinaryDiv,
    BinaryMod,
    MakeFunction,
    MakeAsyncFunction,
    CallFunction,
    FormatValue,
    BuildString,
    Await,
    MakeModule,
    Compare,
    Jump,
    JumpFalse,
    Pop,
    Return,
    BuildList,
    BuildMap,
}

class Instruction {
    inst_type: InstType
    index: number

    constructor(inst_type: InstType, index: number = -1) {
        this.inst_type = inst_type
        this.index = index
    }

    format(): string {
        return this.inst_type.toString() + ':' + this.index.toString()
    }

    hash(): symbol {
        return Symbol.for(this.inst_type.toString() + this.index.toString())
    }

    to(): number {
        return this.index * 100 + this.inst_type
    }

    toString(): string {
        switch (this.inst_type) {
            case InstType.Use:
                return 'Use'
            case InstType.LoadStd:
                return `LoadStd(${this.index})`
            case InstType.LoadConst:
                return `LoadConst(${this.index})`
            case InstType.LoadName:
                return `LoadName(${this.index})`
            case InstType.StoreName:
                return `StoreName(${this.index})`
            case InstType.LoadGlobal:
                return `LoadGlobal(${this.index})`
            case InstType.StoreGlobal:
                return `StoreGlobal(${this.index})`
            case InstType.LoadFast:
                return `LoadFast(${this.index})`
            case InstType.StoreFast:
                return `StoreFast(${this.index})`
            case InstType.BinaryAdd:
                return 'BinaryAdd'
            case InstType.BinarySub:
                return 'BinarySub'
            case InstType.BinaryMul:
                return 'BinaryMul'
            case InstType.BinaryDiv:
                return 'BinaryDiv'
            case InstType.BinaryMod:
                return 'BinaryMod'
            case InstType.MakeFunction:
                return 'MakeFunction'
            case InstType.MakeAsyncFunction:
                return 'MakeAsyncFunction'
            case InstType.CallFunction:
                return 'CallFunction'
            case InstType.FormatValue:
                return 'FormatValue'
            case InstType.BuildString:
                return 'BuildString'
            case InstType.Await:
                return 'Await'
            case InstType.MakeModule:
                return 'MakeModule'
            case InstType.Compare:
                return 'Compare'
            case InstType.Jump:
                return `Jump(${this.index})`
            case InstType.JumpFalse:
                return `JumpFalse(${this.index})`
            case InstType.Pop:
                return 'Pop'
            case InstType.Return:
                return 'Return'
            case InstType.BuildList:
                return `BuildList(${this.index})`
            case InstType.BuildMap:
                return `BuildMap(${this.index})`
        }
    }

    static from(v: number): Instruction {
        let s = v % 100
        let i = Math.floor(v / 100)
        return new Instruction(s, i)
    }
}

export { Instruction, InstType }
