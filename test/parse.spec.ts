import { test, describe } from 'bun:test'
import { Parser, Lexer } from '../src/lib'

describe('Parser', () => {
    test('parser', () => {
        let code = `
        a = 0

        loop {
            a = a + 1

            print(a)

            if a < 10 {
                continue
            }
            
            break
        }
        `
        let lexer = new Lexer(code)
        let parser = new Parser(lexer)
        let e = parser.parse()

        console.log(JSON.stringify(e))
    })
})
