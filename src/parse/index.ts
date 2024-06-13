import { ErrorSyntax } from '../error'
import { Precedence } from '../specification'
import { Token, Lexer, TokenType } from '../token'
import {
    Expression,
    Integer,
    Infix,
    Program,
    Statement,
    Use,
    Return,
    Statements,
    AsyncFunction,
    Function,
    Await,
    String,
    Boolean,
    Call,
    Identifier,
    If,
    Loop,
    While,
    Continue,
    Break,
    List,
    Map,
} from './ast'

const PREFIX = [
    TokenType.Integer,
    TokenType.LeftParen,
    TokenType.LeftBracket,
    TokenType.LeftBrace,
    TokenType.LeftParen,
    TokenType.Keyword,
    TokenType.Identifier,
    TokenType.String,
    TokenType.MlString,
    TokenType.Boolean,
]
const INFIX = [
    TokenType.Plus,
    TokenType.Minus,
    TokenType.Multiply,
    TokenType.Divide,
    TokenType.Mod,
    TokenType.Assign,
    TokenType.Less,
    TokenType.Greater,
    TokenType.LessEqual,
    TokenType.GreaterEqual,
    TokenType.Equal,
    TokenType.NotEqual,
    TokenType.LeftShift,
    TokenType.RightShift,
]

class Parser {
    lexer: Lexer
    token: Token
    next: Token
    errors: Error[]

    constructor(lexer: Lexer) {
        this.token = lexer.get_next_token()
        this.next = lexer.get_next_token()
        this.lexer = lexer
        this.errors = []
    }

    next_token() {
        this.token = this.next
        this.next = this.lexer.get_next_token()
    }

    save_error(error: Error) {
        this.errors.push(error)
    }

    skip() {
        while (
            this.token.token_type == TokenType.Next ||
            this.token.token_type == TokenType.SlComment ||
            this.token.token_type == TokenType.MlComment
        ) {
            this.next_token()
        }
    }

    expect_next(token_type: TokenType) {
        if (this.next.token_type == token_type) {
            this.next_token()
        } else {
            let err = new Error('Invalid syntax, unexpected token')
            this.save_error(err)
            throw err
        }
    }

    parse(): Expression {
        return this.parse_program()
    }

    parse_program(): Expression {
        let stmts: Expression[] = []
        while (this.token.token_type != TokenType.Eof) {
            stmts.push(this.parse_statement())
        }
        return new Program(stmts)
    }

    parse_statement(): Expression {
        return this.parse_expression_statement()
    }

    parse_expression_statement(): Expression {
        let expression = this.parse_expression(Precedence.Lowest)
        this.skip()
        return new Statement(expression)
    }

    parse_expression(precedence: Precedence): Expression {
        this.skip()
        if (!PREFIX.includes(this.token.token_type)) {
            let info = `Invalid syntax, unexpected expression: [${this.token.content}] [line: {${this.token.metadata.area.start[0]}}, column: {${this.token.metadata.area.start[1]}}]`
            let err = new ErrorSyntax(info)
            this.save_error(err)
            throw err
        }
        let e: Expression
        switch (this.token.token_type) {
            case TokenType.Integer:
                e = this.parse_integer()
                break
            case TokenType.LeftParen:
                e = this.parse_group()
                break
            case TokenType.LeftBracket:
                e = this.parse_list()
                break
            case TokenType.LeftBrace:
                e = this.parse_map()
                break
            case TokenType.Keyword:
                e = this.parse_keyword()
                break
            case TokenType.String:
            case TokenType.MlString:
                e = this.parse_string()
                break
            case TokenType.Boolean:
                e = this.parse_boolean()
                break
            case TokenType.Identifier:
                let id = this.parse_identifier()
                // @ts-ignore
                if (this.token.token_type == TokenType.LeftParen) {
                    e = this.parse_call(id)
                } else {
                    e = id
                }
                break
            default:
                let err = new Error('Invalid syntax')
                this.save_error(err)
                throw err
        }
        while (
            // @ts-ignore
            this.token.token_type != TokenType.Next &&
            precedence < this.token.metadata.precedence
        ) {
            if (!INFIX.includes(this.token.token_type)) {
                return e
            }
            e = this.parse_infix(e)
        }
        this.skip()
        return e
    }

    parse_integer(): Expression {
        let content = this.token.content
        content = content.replace(/_/g, '')
        this.next_token()
        return new Integer(parseInt(content))
    }

    parse_group(): Expression {
        this.next_token()
        let e = this.parse_expression(Precedence.Lowest)
        this.next_token()
        if (this.token.token_type != TokenType.RightParen) {
            let info = `Invalid syntax, unexpected token: [line: {${this.token.metadata.area.start[0]}}, column: {${this.token.metadata.area.start[1]}}]`
            let err = new ErrorSyntax(info)
            this.save_error(err)
            throw err
        }
        return e
    }

    parse_list(): Expression {
        let body = []
        this.next_token()
        while (this.token.token_type != TokenType.RightBracket) {
            if (this.token.token_type == TokenType.Comma) {
                this.next_token()
                continue
            }
            body.push(this.parse_expression(Precedence.Lowest))
        }
        this.next_token()
        return new List(body)
    }

    parse_map(): Expression {
        let body = []
        this.next_token()
        while (this.token.token_type != TokenType.RightBrace) {
            if (
                this.token.token_type == TokenType.Comma ||
                this.token.token_type == TokenType.Colon
            ) {
                this.next_token()
                continue
            }
            body.push(this.parse_expression(Precedence.Lowest))
        }
        this.next_token()
        return new Map(body)
    }

    parse_keyword(): Expression {
        let content = this.token.content
        let e
        switch (content) {
            case 'use':
                return this.parse_use()
            case 'async':
                e = this.parse_async_function()
                this.next_token()
                return e
            case 'fn':
                e = this.parse_function()
                this.next_token()
                return e
            case 'await':
                return this.parse_await()
            case 'return':
                return this.parse_return()
            case 'if':
                return this.parse_if()
            case 'loop':
                return this.parse_loop()
            case 'while':
                return this.parse_while()
            case 'continue':
                return this.parse_continue()
            case 'break':
                return this.parse_break()
            default:
                throw new ErrorSyntax(
                    `Invalid keyword ${this.token.toString()}`,
                )
        }
    }

    parse_use(): Expression {
        this.next_token()
        let token
        let path = []
        while (true) {
            if (this.token.token_type != TokenType.Identifier) {
                throw new ErrorSyntax(
                    `Invalid syntax ${this.token.metadata.area}`,
                )
            }
            path.push(this.token)
            token = this.token

            this.next_token()

            // @ts-ignore
            if (this.token.token_type == TokenType.Dot) {
                this.next_token()
                continue
            } else if (
                // @ts-ignore
                this.token.token_type == TokenType.Keyword &&
                this.token.content == 'as'
            ) {
                this.next_token()
                // @ts-ignore
                if (this.token.token_type == TokenType.Identifier) {
                    token = this.token
                    break
                } else {
                    throw new ErrorSyntax(
                        `Invalid syntax ${this.token.metadata.area}`,
                    )
                }
            } else {
                break
            }
        }
        return new Use(token, path)
    }

    parse_return(): Expression {
        let e = null
        this.next_token()
        if (
            this.token.token_type != TokenType.Next &&
            this.token.token_type != TokenType.RightBrace
        ) {
            e = this.parse_expression(Precedence.Lowest)
        }
        return new Return(e)
    }

    parse_async_function(): Expression {
        this.next_token()
        this.next_token()

        if (this.token.token_type != TokenType.Identifier) {
            let err = new ErrorSyntax(
                `Invalid syntax ${this.token.metadata.area}`,
            )
            this.save_error(err)
            throw err
        }

        let token = this.token
        this.next_token()
        // @ts-ignore
        if (this.token.token_type != TokenType.LeftParen) {
            throw new ErrorSyntax(`Invalid syntax ${this.token.metadata.area}`)
        }
        this.next_token()
        let args = []
        let annotation = []
        while (this.token.token_type != TokenType.RightParen) {
            if (this.token.token_type == TokenType.Colon) {
                this.next_token()
                annotation.push(this.next)
                this.next_token()
            } else if (this.token.token_type == TokenType.Comma) {
                this.next_token()
                continue
            } else {
                args.push(this.token)
                this.next_token()
            }
        }

        this.next_token()
        if (this.token.token_type != TokenType.LeftBrace) {
            throw new ErrorSyntax(`Invalid syntax ${this.token.metadata.area}`)
        }
        this.next_token()

        let body = []
        while (this.token.token_type != TokenType.RightBrace) {
            body.push(this.parse_expression(Precedence.Lowest))
            this.skip()
        }
        this.next_token()

        return new AsyncFunction(token, args, annotation, body)
    }
    parse_function(): Expression {
        this.next_token()

        if (this.token.token_type != TokenType.Identifier) {
            throw new ErrorSyntax(`Invalid syntax ${this.token.metadata.area}`)
        }

        let token = this.token
        this.next_token()
        // @ts-ignore
        if (this.token.token_type != TokenType.LeftParen) {
            throw new ErrorSyntax(`Invalid syntax ${this.token.metadata.area}`)
        }
        this.next_token()
        let args = []
        let annotation = []
        while (this.token.token_type != TokenType.RightParen) {
            if (this.token.token_type == TokenType.Colon) {
                this.next_token()
                annotation.push(this.next)
                this.next_token()
            } else if (this.token.token_type == TokenType.Comma) {
                this.next_token()
                continue
            } else {
                args.push(this.token)
                this.next_token()
            }
        }

        this.next_token()
        if (this.token.token_type != TokenType.LeftBrace) {
            throw new ErrorSyntax(`Invalid syntax ${this.token.metadata.area}`)
        }
        this.next_token()

        let body = []
        while (this.token.token_type != TokenType.RightBrace) {
            body.push(this.parse_expression(Precedence.Lowest))
            this.skip()
        }
        this.next_token()

        return new Function(token, args, annotation, body)
    }

    parse_await(): Expression {
        this.next_token()

        let token = this.token
        this.next_token()
        if (this.token.token_type != TokenType.LeftParen) {
            throw new ErrorSyntax(`Invalid syntax ${this.token.metadata.area}`)
        }
        this.next_token()
        let args = []
        // @ts-ignore
        while (this.token.token_type != TokenType.RightParen) {
            // @ts-ignore
            if (this.token.token_type == TokenType.Comma) {
                this.next_token()
                continue
            }
            args.push(this.parse_expression(Precedence.Lowest))
        }
        this.next_token()
        return new Await(token, args)
    }

    parse_string(): Expression {
        let t = this.token
        this.next_token()
        return new String(t, t.content)
    }

    parse_boolean(): Expression {
        let t = this.token
        let v = t.content == 'true'
        this.next_token()
        return new Boolean(t, v)
    }

    parse_call(name: Expression): Expression {
        if (this.token.token_type != TokenType.LeftParen) {
            throw new ErrorSyntax(`Invalid syntax ${this.token.metadata.area}`)
        }
        this.next_token()
        let args = []
        while (
            // @ts-ignore
            this.token.token_type != TokenType.RightParen &&
            // @ts-ignore
            this.token.token_type != TokenType.Eof
        ) {
            // @ts-ignore
            if (this.token.token_type == TokenType.Comma) {
                this.next_token()
                continue
            }
            let e = this.parse_expression(Precedence.Lowest)
            args.push(e)
        }
        this.next_token()
        return new Call(name, args)
    }

    parse_identifier(): Expression {
        let t = this.token
        this.next_token()
        return new Identifier(t)
    }

    parse_infix(left: Expression): Expression {
        let token = this.token
        let precedence = this.token.metadata.precedence
        this.next_token()
        let right = this.parse_expression(precedence)
        return new Infix(left, right, token)
    }

    parse_if(): Expression {
        this.next_token()
        let condition = this.parse_expression(Precedence.Lowest)
        this.skip()

        if (this.token.token_type == TokenType.LeftBrace) {
            this.next_token()
        } else {
            throw new ErrorSyntax(
                `Invalid syntax ${this.token.metadata.area.start}`,
            )
        }

        let consequence = []
        // @ts-ignore
        while (this.token.token_type != TokenType.RightBrace) {
            consequence.push(this.parse_expression(Precedence.Lowest))
        }
        this.next_token()

        let alternative = []
        if (
            this.token.token_type == TokenType.Keyword &&
            this.token.content == 'else'
        ) {
            this.next_token()

            if (
                this.token.token_type == TokenType.Keyword &&
                // @ts-ignore
                this.token.content == 'if'
            ) {
                let e = this.parse_if()
                alternative.push(e)
            } else {
                if (this.token.token_type == TokenType.LeftBrace) {
                    this.next_token()
                } else {
                    throw new ErrorSyntax(
                        `Invalid syntax ${this.token.metadata.area}`,
                    )
                }
                while (this.token.token_type != TokenType.RightBrace) {
                    alternative.push(this.parse_expression(Precedence.Lowest))
                }
                this.next_token()
            }
        }
        return new If(condition, consequence, alternative)
    }

    parse_loop(): Expression {
        this.next_token()

        this.skip()

        if (this.token.token_type != TokenType.LeftBrace) {
            throw new ErrorSyntax(`Invalid syntax ${this.token.metadata.area}`)
        }
        this.next_token()

        let consequence = []
        // @ts-ignore
        while (this.token.token_type != TokenType.RightBrace) {
            consequence.push(this.parse_expression(Precedence.Lowest))
        }
        this.next_token()
        return new Loop(consequence)
    }

    parse_while(): Expression {
        this.next_token()
        let condition = this.parse_expression(Precedence.Lowest)
        this.skip()

        if (this.token.token_type != TokenType.LeftBrace) {
            throw new ErrorSyntax(`Invalid syntax ${this.token.metadata.area}`)
        }
        this.next_token()

        let consequence = []
        // @ts-ignore
        while (this.token.token_type != TokenType.RightBrace) {
            consequence.push(this.parse_expression(Precedence.Lowest))
        }
        this.next_token()
        return new While(condition, consequence)
    }

    parse_continue(): Expression {
        return new Continue()
    }

    parse_break(): Expression {
        let e = null
        this.next_token()

        if (
            this.token.token_type != TokenType.Next &&
            this.token.token_type != TokenType.RightBrace
        ) {
            e = this.parse_expression(Precedence.Lowest)
        }
        return new Break(e)
    }
}

export { Parser }
export {
    Expression,
    Integer,
    Infix,
    Program,
    Statement,
    Use,
    Return,
    Statements,
    AsyncFunction,
    Function,
    Await,
    String,
    Boolean,
    Call,
    Identifier,
    If,
    Loop,
    While,
    Continue,
    Break,
    List,
    Map,
}
