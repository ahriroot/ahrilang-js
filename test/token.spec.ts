import { expect, test, describe } from 'bun:test'
import { Token, Lexer, TokenType } from '../src/lib'

describe('Lexer', () => {
    test('tokenizer', () => {
        let code = `(1 + 2) * 3
        1 + 2 * 3
        1 + 2 * 3 + 4`
        let tokenizer = new Lexer(code)
        let tokens: Token[] = []
        while (true) {
            let t = tokenizer.get_next_token()
            tokens.push(t)
            if (t.token_type == TokenType.Eof) {
                break
            }
        }
        let ts = tokens.map((t) => t.content)

        expect(ts.join('')).toEqual('(1+2)*3\n1+2*3\n1+2*3+4')
    })

    test('tokenizer', () => {
        let code = `fn add(a, b) {
            return a + b
        }

        // add
        res = add(1, 2)

        /**
         * comment
         */
        print(res)

        "123"
        \`123
        456
        \`
        `
        let tokenizer = new Lexer(code)
        let tokens: Token[] = []
        while (true) {
            let t = tokenizer.get_next_token()
            tokens.push(t)
            if (t.token_type == TokenType.Eof) {
                break
            }
        }
    })
})
