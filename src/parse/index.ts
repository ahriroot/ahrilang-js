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
} from './ast'

const PREFIX = [
    TokenType.Integer,
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
            this.next_token()
        }
        return new Program(stmts)
    }

    parse_statement(): Expression {
        return this.parse_expression_statement()
    }

    parse_expression_statement(): Expression {
        while (
            this.token.token_type == TokenType.Next ||
            this.token.token_type == TokenType.SlComment ||
            this.token.token_type == TokenType.MlComment
        ) {
            this.next_token()
        }
        let expression = this.parse_expression(Precedence.Lowest)
        while (
            this.next.token_type == TokenType.Next ||
            this.next.token_type == TokenType.SlComment ||
            this.next.token_type == TokenType.MlComment
        ) {
            this.next_token()
        }
        return new Statement(expression)
    }

    parse_expression(precedence: Precedence): Expression {
        if (!PREFIX.includes(this.token.token_type)) {
            let info = `Invalid syntax, unexpected expression: [line: {${this.token.metadata.area.start[0]}}, column: {${this.token.metadata.area.start[1]}}]`
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
                if (this.next.token_type == TokenType.LeftParen) {
                    e = this.parse_call()
                } else {
                    e = this.parse_identifier()
                }
                break
            default:
                let err = new Error('Invalid syntax')
                this.save_error(err)
                throw err
        }
        while (
            this.next.token_type != TokenType.Next &&
            precedence < this.next.metadata.precedence
        ) {
            if (!INFIX.includes(this.next.token_type)) {
                return e
            }
            this.next_token()
            e = this.parse_infix(e)
        }
        return e
    }

    parse_integer(): Expression {
        return new Integer(parseInt(this.token.content))
    }

    parse_group(): Expression {
        this.next_token()
        let e = this.parse_expression(Precedence.Lowest)
        this.expect_next(TokenType.RightParen)
        return e
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
            default:
                throw new ErrorSyntax(
                    `Invalid keyword ${this.token.metadata.area}`,
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
        this.next_token()
        let e = this.parse_expression(Precedence.Lowest)
        return new Return(e)
    }

    parse_async_function(): Expression {
        this.next_token()
        this.expect_next(TokenType.Identifier)

        let token = this.token
        this.next_token()
        if (this.token.token_type != TokenType.LeftParen) {
            throw new ErrorSyntax(`Invalid syntax ${this.token.metadata.area}`)
        }
        this.next_token()
        let args = []
        let annotation = []
        while (true) {
            // @ts-ignore
            if (this.token.token_type != TokenType.Identifier) {
                throw new ErrorSyntax(
                    `Invalid syntax ${this.token.metadata.area}`,
                )
            }
            args.push(this.token)
            this.next_token()
            if (this.token.token_type == TokenType.Colon) {
                this.next_token()
                annotation.push(this.next)
                this.next_token()
            } else if (this.token.token_type == TokenType.Comma) {
                this.next_token()
                continue
            } else if (this.token.token_type == TokenType.RightParen) {
                break
            } else {
                throw new ErrorSyntax(
                    `Invalid syntax ${this.token.metadata.area}`,
                )
            }
        }

        this.next_token()
        if (this.token.token_type != TokenType.LeftBrace) {
            throw new ErrorSyntax(`Invalid syntax ${this.token.metadata.area}`)
        }
        this.next_token()

        let body = []
        while (true) {
            if (this.token.token_type == TokenType.RightBrace) {
                break
            }
            if (this.token.token_type == TokenType.Next) {
                this.next_token()
                continue
            }
            body.push(this.parse_statement())
        }

        return new AsyncFunction(token, args, annotation, body)
    }
    parse_function(): Expression {
        this.expect_next(TokenType.Identifier)

        let token = this.token
        this.next_token()
        if (this.token.token_type != TokenType.LeftParen) {
            throw new ErrorSyntax(`Invalid syntax ${this.token.metadata.area}`)
        }
        this.next_token()
        let args = []
        let annotation = []
        while (true) {
            // @ts-ignore
            if (this.token.token_type != TokenType.Identifier) {
                throw new ErrorSyntax(
                    `Invalid syntax ${this.token.metadata.area}`,
                )
            }
            args.push(this.token)
            this.next_token()
            if (this.token.token_type == TokenType.Colon) {
                this.next_token()
                annotation.push(this.next)
                this.next_token()
            } else if (this.token.token_type == TokenType.Comma) {
                this.next_token()
                continue
            } else if (this.token.token_type == TokenType.RightParen) {
                break
            } else {
                throw new ErrorSyntax(
                    `Invalid syntax ${this.token.metadata.area}`,
                )
            }
        }

        this.next_token()
        if (this.token.token_type != TokenType.LeftBrace) {
            throw new ErrorSyntax(`Invalid syntax ${this.token.metadata.area}`)
        }
        this.next_token()

        let body = []
        while (true) {
            if (this.token.token_type == TokenType.RightBrace) {
                break
            }
            if (this.token.token_type == TokenType.Next) {
                this.next_token()
                continue
            }
            body.push(this.parse_statement())
        }

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
        while (true) {
            // @ts-ignore
            if (this.token.token_type == TokenType.RightParen) {
                break
            }
            // @ts-ignore
            if (this.token.token_type == TokenType.Comma) {
                this.next_token()
                continue
            }
            args.push(this.parse_expression(Precedence.Lowest))
            this.next_token()
        }
        this.next_token()
        return new Await(token, args)
    }

    parse_string(): Expression {
        return new String(this.token, this.token.content)
    }

    parse_boolean(): Expression {
        return new Boolean(this.token, this.token.content == 'true')
    }

    parse_call(): Expression {
        let token = this.token
        this.next_token()
        if (this.token.token_type != TokenType.LeftParen) {
            throw new ErrorSyntax(`Invalid syntax ${this.token.metadata.area}`)
        }
        this.next_token()
        let args = []
        while (true) {
            // @ts-ignore
            if (this.token.token_type == TokenType.RightParen) {
                break
            }
            // @ts-ignore
            if (this.token.token_type == TokenType.Comma) {
                this.next_token()
                continue
            }
            args.push(this.parse_expression(Precedence.Lowest))
            this.next_token()
        }
        this.next_token()
        return new Call(token, args)
    }

    parse_identifier(): Expression {
        return new Identifier(this.token)
    }

    parse_infix(left: Expression): Expression {
        let token = this.token
        let precedence = this.token.metadata.precedence
        this.next_token()
        let right = this.parse_expression(precedence)
        return new Infix(left, right, token)
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
}
