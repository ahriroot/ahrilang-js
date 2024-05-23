import { test, describe } from 'bun:test'
import { Parser, Lexer, Compiler } from '../src/lib'

describe('Compiler', () => {
    test('compiler', () => {
        let code = `
        use std.thread as t
        async fn add(a, b) {
            return a / b
        }
        join = thread(add, 1, 2)
        res = join()
        print(res)
        
        a = true
        print(a)

        await add(1, 2)
        `
        let lexer = new Lexer(code)
        let parser = new Parser(lexer)
        let e = parser.parse()

        let compiler = new Compiler([], [])
        let instructions = compiler.compile(e)

        compiler.display();

        console.log(JSON.stringify(instructions))
    })
})
