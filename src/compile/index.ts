import { ErrorRuntime } from '../error'
import { Instruction, InstType } from '../instruction'
import {
    ObjectAsyncFrame,
    ObjectBase,
    ObjectBoolean,
    ObjectConsts,
    ObjectInstructions,
    ObjectInteger,
    ObjectNames,
    ObjectString,
} from '../object'
import {
    AsyncFunction,
    Await,
    Boolean,
    Call,
    Expression,
    Function,
    Identifier,
    If,
    Infix,
    Integer,
    Parser,
    Program,
    Return,
    Statement,
    Statements,
    String,
    Use,
} from '../parse'
import { Lexer, TokenType } from '../token'
import { AsyncFrame, Runtime } from '../vm'

class Compiler {
    instructions: Instruction[]
    consts: ObjectBase[]
    names: ObjectBase[]
    globals: ObjectBase[]

    constructor(names: ObjectBase[], globals: ObjectBase[]) {
        this.instructions = []
        this.consts = []
        this.names = names
        this.globals = globals
    }

    make_const(obj: ObjectBase): number {
        this.consts.push(obj)
        return this.consts.length - 1
    }

    make_name(obj: ObjectBase): number {
        let index = this.names.indexOf(obj)
        if (index >= 0) {
            return index
        }
        this.names.push(obj)
        return this.names.length - 1
    }

    make_instruction(instruction: Instruction): number {
        this.instructions.push(instruction)
        return this.instructions.length - 1
    }

    compile(node: Expression): [ObjectBase[], ObjectBase[], Instruction[]] {
        switch (node.type) {
            case 'Program':
                this.compile_program(node as Program)
                break
            case 'Use':
                this.compile_use(node as Use)
                break
            case 'Statements':
                this.compile_program(node as Statements)
                break
            case 'AsyncFunction':
                this.compile_async_function(node as AsyncFunction)
                break
            case 'Function':
                this.compile_function(node as Function)
                break
            case 'Return':
                this.compile_return(node as Return)
                break
            case 'Call':
                this.compile_call(node as Call)
                break
            case 'Await':
                this.compile_await(node as Await)
                break
            case 'Integer':
                this.compile_integer(node as Integer)
                break
            case 'String':
                this.compile_string(node as String)
                break
            case 'Boolean':
                this.compile_boolean(node as Boolean)
                break
            case 'Identifier':
                this.compile_identifier(node as Identifier)
                break
            case 'Infix':
                this.compile_infix(node as Infix)
                break
            case 'Statement':
                this.compile_statement(node as Statement)
                break
            case 'If':
                this.compile_if(node as If)
                break
        }
        return [this.consts, this.names, this.instructions]
    }

    compile_program(node: Program | Statements) {
        node.expressions.forEach((e) => {
            this.compile(e)
        })
    }

    compile_use(node: Use) {
        let token = node.name
        let path = node.path

        let index = this.make_const(new ObjectString(path.join('.')))
        this.make_instruction(new Instruction(InstType.LoadConst, index))
        this.make_instruction(new Instruction(InstType.Use, 1))
        let index_name = this.make_name(new ObjectString(token.content))
        this.make_instruction(new Instruction(InstType.StoreName, index_name))
    }

    compile_async_function(node: AsyncFunction) {
        let token = node.name
        let args = node.args
        let body = node.body

        let args_obj = args.map((a) => new ObjectString(a.content))

        let compiler = new Compiler(args_obj, this.names)

        let [consts, names, instructions] = compiler.compile(
            new Statements(body),
        )

        let index = this.make_const(new ObjectConsts(consts))
        this.make_instruction(new Instruction(InstType.LoadConst, index))
        let index_name = this.make_const(new ObjectNames(names))
        this.make_instruction(new Instruction(InstType.LoadConst, index_name))
        let index_inst = this.make_const(new ObjectInstructions(instructions))
        this.make_instruction(new Instruction(InstType.LoadConst, index_inst))
        this.make_instruction(new Instruction(InstType.MakeAsyncFunction, 0))
        let index_name_func = this.make_name(new ObjectString(token.content))
        this.make_instruction(
            new Instruction(InstType.StoreName, index_name_func),
        )
    }

    compile_function(node: Function) {
        let token = node.name
        let args = node.args
        let body = node.body

        let args_obj = args.map((a) => new ObjectString(a.content))

        let compiler = new Compiler(args_obj, this.names)

        let [consts, names, instructions] = compiler.compile(
            new Statements(body),
        )

        let index = this.make_const(new ObjectConsts(consts))
        this.make_instruction(new Instruction(InstType.LoadConst, index))
        let index_name = this.make_const(new ObjectNames(names))
        this.make_instruction(new Instruction(InstType.LoadConst, index_name))
        let index_inst = this.make_const(new ObjectInstructions(instructions))
        this.make_instruction(new Instruction(InstType.LoadConst, index_inst))
        this.make_instruction(new Instruction(InstType.MakeFunction, 0))
        let index_name_func = this.make_name(new ObjectString(token.content))
        this.make_instruction(
            new Instruction(InstType.StoreName, index_name_func),
        )
    }

    compile_return(node: Return) {
        let expression = node.expression
        this.compile(expression)
        this.make_instruction(new Instruction(InstType.Return))
    }

    compile_call(node: Call) {
        let token = node.token
        let args = node.expressions

        let count = args.length
        for (let i = 0; i < count; i++) {
            this.compile(args[i])
        }

        let index = this.names.findIndex(
            (item) => (item as ObjectString).value === token.content,
        )
        if (index >= 0) {
            this.make_instruction(new Instruction(InstType.LoadName, index))
            this.make_instruction(new Instruction(InstType.CallFunction, count))
        } else {
            let index_global = this.globals.findIndex(
                (item) => (item as ObjectString).value === token.content,
            )
            if (index_global >= 0) {
                this.make_instruction(
                    new Instruction(InstType.LoadGlobal, index_global),
                )
                this.make_instruction(
                    new Instruction(InstType.CallFunction, count),
                )
                this.make_instruction(new Instruction(InstType.Await))
            } else {
                switch (token.content) {
                    case 'print':
                        this.make_instruction(
                            new Instruction(InstType.LoadStd, 0),
                        )
                        this.make_instruction(
                            new Instruction(InstType.CallFunction, count),
                        )
                        break
                    case 'thread':
                        this.make_instruction(
                            new Instruction(InstType.LoadStd, 1),
                        )
                        this.make_instruction(
                            new Instruction(InstType.CallFunction, count),
                        )
                        break
                    case 'coroutine':
                        this.make_instruction(
                            new Instruction(InstType.LoadStd, 2),
                        )
                        this.make_instruction(
                            new Instruction(InstType.CallFunction, count),
                        )
                        break
                    default:
                        throw new ErrorRuntime(
                            `Name not found: ${token.content}`,
                        )
                }
            }
        }
    }

    compile_await(node: Await) {
        let token = node.token
        let args = node.expressions

        let count = args.length
        for (let i = 0; i < count; i++) {
            this.compile(args[i])
        }

        let index = this.names.findIndex(
            (item) => (item as ObjectString).value === token.content,
        )
        if (index >= 0) {
            this.make_instruction(new Instruction(InstType.LoadName, index))
            this.make_instruction(new Instruction(InstType.CallFunction, count))
        } else {
            let index_global = this.globals.findIndex(
                (item) => (item as ObjectString).value === token.content,
            )
            if (index_global >= 0) {
                this.make_instruction(
                    new Instruction(InstType.LoadGlobal, index_global),
                )
                this.make_instruction(
                    new Instruction(InstType.CallFunction, count),
                )
                this.make_instruction(new Instruction(InstType.Await))
            } else {
                switch (token.content) {
                    case 'print':
                        this.make_instruction(
                            new Instruction(InstType.LoadStd, 0),
                        )
                        this.make_instruction(
                            new Instruction(InstType.CallFunction, count),
                        )
                        break
                    case 'thread':
                        this.make_instruction(
                            new Instruction(InstType.LoadStd, 1),
                        )
                        this.make_instruction(
                            new Instruction(InstType.CallFunction, count),
                        )
                        break
                    case 'coroutine':
                        this.make_instruction(
                            new Instruction(InstType.LoadStd, 2),
                        )
                        this.make_instruction(
                            new Instruction(InstType.CallFunction, count),
                        )
                        break
                    default:
                        throw new ErrorRuntime(
                            `Name not found: ${token.content}`,
                        )
                }
            }
        }
    }

    compile_integer(node: Integer) {
        let value = node.value
        let index = this.make_const(new ObjectInteger(value))
        this.make_instruction(new Instruction(InstType.LoadConst, index))
    }

    compile_string(node: String) {
        let value = node.value
        let index = this.make_const(new ObjectString(value))
        this.make_instruction(new Instruction(InstType.LoadConst, index))
    }

    compile_boolean(node: Boolean) {
        let value = node.value
        let index = this.make_const(new ObjectBoolean(value))
        this.make_instruction(new Instruction(InstType.LoadConst, index))
    }

    compile_identifier(node: Identifier) {
        let token = node.token
        let index = this.names.findIndex(
            (item) => (item as ObjectString).value === token.content,
        )
        if (index >= 0) {
            this.make_instruction(new Instruction(InstType.LoadName, index))
        }
    }

    compile_infix(node: Infix) {
        let token = node.operator
        let left = node.left
        let right = node.right
        switch (token.token_type) {
            case TokenType.Plus:
                this.compile(left)
                this.compile(right)
                this.make_instruction(new Instruction(InstType.BinaryAdd))
                break
            case TokenType.Minus:
                this.compile(left)
                this.compile(right)
                this.make_instruction(new Instruction(InstType.BinarySub))
                break
            case TokenType.Multiply:
                this.compile(left)
                this.compile(right)
                this.make_instruction(new Instruction(InstType.BinaryMul))
                break
            case TokenType.Divide:
                this.compile(left)
                this.compile(right)
                this.make_instruction(new Instruction(InstType.BinaryDiv))
                break
            case TokenType.Mod:
                this.compile(left)
                this.compile(right)
                this.make_instruction(new Instruction(InstType.BinaryMod))
                break
            case TokenType.Assign:
                this.compile(right)
                let index = this.make_name(
                    new ObjectString((left as Identifier).token.content),
                )
                this.make_instruction(
                    new Instruction(InstType.StoreName, index),
                )
                break
            case TokenType.Equal:
                this.compile(left)
                this.compile(right)
                this.make_instruction(new Instruction(InstType.Compare, 0))
                break
            case TokenType.NotEqual:
                this.compile(left)
                this.compile(right)
                this.make_instruction(new Instruction(InstType.Compare, 1))
                break
            case TokenType.Greater:
                this.compile(left)
                this.compile(right)
                this.make_instruction(new Instruction(InstType.Compare, 2))
                break
            case TokenType.Less:
                this.compile(left)
                this.compile(right)
                this.make_instruction(new Instruction(InstType.Compare, 3))
                break
            case TokenType.GreaterEqual:
                this.compile(left)
                this.compile(right)
                this.make_instruction(new Instruction(InstType.Compare, 4))
                break
            case TokenType.LessEqual:
                this.compile(left)
                this.compile(right)
                this.make_instruction(new Instruction(InstType.Compare, 5))
                break
            default:
                break
        }
    }

    compile_statement(node: Statement) {
        this.compile(node.expression)
    }

    compile_if(node: If) {
        let condition = node.condition
        let consequence = node.consequence
        let alternative = node.alternative
        this.compile(condition)
        let index = this.make_instruction(
            new Instruction(InstType.JumpFalse, 0),
        )
        for (let statement of consequence) {
            this.compile(statement)
        }
        let index2 = this.make_instruction(new Instruction(InstType.Jump, 0))
        this.instructions[index].index = this.instructions.length
        for (let statement of alternative) {
            this.compile(statement)
        }
        this.instructions[index2].index = this.instructions.length
    }

    static build(code: string): Uint8Array {
        let lexer = new Lexer(code)
        let parser = new Parser(lexer)
        let expression = parser.parse()

        let compiler = new Compiler([], [])
        let [consts, names, instructions] = compiler.compile(expression)

        let runtime = new Runtime([])

        let frame = new AsyncFrame(
            runtime,
            null,
            new ObjectConsts(consts),
            new ObjectNames(names),
            new ObjectInstructions(instructions),
            0,
            {},
        )

        let obj = new ObjectAsyncFrame(frame)
        let json = obj.to()
        let data = JSON.stringify(json)

        let lengthPrefix = new ArrayBuffer(8)
        let dataView = new DataView(lengthPrefix)
        dataView.setBigUint64(0, BigInt(data.length), true)
        let prefixArray = new Uint8Array(lengthPrefix)

        let dataWithPrefix = new Uint8Array(8 + data.length)
        dataWithPrefix.set(prefixArray, 0)
        dataWithPrefix.set(new TextEncoder().encode(data), 8)

        return dataWithPrefix
    }

    display() {
        console.log('consts', JSON.stringify(this.consts))
        console.log('instructions', JSON.stringify(this.instructions))
        console.log('names', JSON.stringify(this.names))
    }
}

export { Compiler }
