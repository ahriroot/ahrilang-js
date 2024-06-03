import { ErrorSyntax } from '../error'
import { ExprType, KEYWORDS, Precedence } from '../specification'
import { Token, TokenType } from './token'

class Lexer {
    code: string
    last: Token
    current: Token
    line: number
    column: number
    pos: number
    len: number

    constructor(code: string) {
        this.code = code
        this.last = Token.void()
        this.current = Token.void()
        this.line = 1
        this.column = 0
        this.pos = 0
        this.len = code.length
    }

    make_token(next: Token): Token {
        let token = this.current
        token.metadata.precedence = next.metadata.precedence
        token.metadata.area.end = [this.line, this.column]
        switch (token.token_type) {
            case TokenType.Void:
                break
            case TokenType.Keyword:
                break
            case TokenType.Identifier:
                if (token.content == 'true' || token.content == 'false') {
                    token.token_type = TokenType.Boolean
                } else if (KEYWORDS.includes(token.content)) {
                    token.token_type = TokenType.Keyword
                }
                break
            case TokenType.Integer:
                break
            case TokenType.Float:
                break
            case TokenType.String:
                break
            case TokenType.Boolean:
                break
            case TokenType.Not:
                token.metadata.precedence = Precedence.Prefix
                break
            case TokenType.Plus:
                token.metadata.precedence = Precedence.Term
                break
            case TokenType.Minus:
                token.metadata.precedence = Precedence.Term
                break
            case TokenType.Multiply:
                token.metadata.precedence = Precedence.Factor
                break
            case TokenType.Divide:
                token.metadata.precedence = Precedence.Factor
                break
            case TokenType.Power:
            case TokenType.LeftShift:
            case TokenType.RightShift:
                token.metadata.precedence = Precedence.Power
                break
            case TokenType.LeftParen:
                break
            case TokenType.RightParen:
                break
            case TokenType.LeftBrace:
                break
            case TokenType.RightBrace:
                break
            case TokenType.Assign:
                token.metadata.precedence = Precedence.Assign
                token.metadata.expr = ExprType.Infix
                break
            case TokenType.Equal:
            case TokenType.Greater:
            case TokenType.GreaterEqual:
            case TokenType.Less:
            case TokenType.LessEqual:
            case TokenType.NotEqual:
                token.metadata.precedence = Precedence.Compare
                break
            case TokenType.Dot:
                token.metadata.precedence = Precedence.Dot
                break
            case TokenType.Next:
                break
            case TokenType.MlString:
                break
            case TokenType.Sof:
                break
            case TokenType.Eof:
                break
        }
        this.last = token
        this.current = next
        return token
    }

    get_next_token(): Token {
        let t: Token | void
        while (this.pos < this.len) {
            this.pos++
            this.column++
            let c = this.code[this.pos - 1]

            switch (c) {
                case '\n':
                    t = this.handle_new_line()
                    if (t) {
                        return t
                    }
                    break
                case ' ':
                    t = this.handle_space()
                    if (t) {
                        return t
                    }
                    break
                default:
                    if ((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z')) {
                        t = this.handle_identifier(c)
                        if (t) {
                            return t
                        }
                    } else if (c >= '0' && c <= '9') {
                        t = this.handle_number(c)
                        if (t) {
                            return t
                        }
                    } else if (c == '_') {
                        t = this.handle_underscore()
                        if (t) {
                            return t
                        }
                    } else if (
                        c == '(' ||
                        c == ')' ||
                        c == '{' ||
                        c == '}' ||
                        c == '[' ||
                        c == ']'
                    ) {
                        t = this.handle_group_block(c)
                        if (t) {
                            return t
                        }
                    } else if (
                        c == '+' ||
                        c == '-' ||
                        c == '*' ||
                        c == '/' ||
                        c == '%'
                    ) {
                        t = this.handle_operator(c)
                        if (t) {
                            return t
                        }
                    } else if (c == '=') {
                        t = this.handle_assign()
                        if (t) {
                            return t
                        }
                    } else if (c == ',') {
                        t = this.handle_comma()
                        if (t) {
                            return t
                        }
                    } else if (c == ':') {
                        t = this.handle_colon()
                        if (t) {
                            return t
                        }
                    } else if (c == '"') {
                        t = this.handle_string(c)
                        if (t) {
                            return t
                        }
                    } else if (c == '`') {
                        t = this.handle_mlstring(c)
                        if (t) {
                            return t
                        }
                    } else if (c == '.') {
                        t = this.handle_dot()
                        if (t) {
                            return t
                        }
                    } else if (c == '!') {
                        t = this.handle_not()
                        if (t) {
                            return t
                        }
                    } else if (c == '>' || c == '<') {
                        t = this.handle_compare(c)
                        if (t) {
                            return t
                        }
                    } else if (c == '\r') {
                    } else {
                        throw new ErrorSyntax('unexpected character')
                    }
                    break
            }
        }

        this.column++

        if (this.current.token_type == TokenType.Void) {
            return Token.new_token([this.line, this.column], TokenType.Eof, '')
        }

        return this.make_token(
            Token.new_token([this.line, this.column], TokenType.Eof, ''),
        )
    }

    get_tokens(): Token[] {
        let tokens = []
        while (true) {
            let token = this.get_next_token()
            tokens.push(token)
            if (token.token_type == TokenType.Eof) {
                break
            }
        }
        return tokens
    }

    handle_new_line(): Token | void {
        let t
        switch (this.current.token_type) {
            case TokenType.Void:
                this.current = this.new_nl()
                break
            case TokenType.SlComment:
                t = this.make_token(this.new_nl())
                this.next_line()
                return t
            case TokenType.MlComment:
                this.current.content += '\n'
                break
            case TokenType.MlString:
                this.current.content += '\n'
                break
            case TokenType.String:
                this.next_line()
                throw new ErrorSyntax('unexpected new line in string')
            default:
                t = this.make_token(this.new_nl())
                this.next_line()
                return t
        }
        this.next_line()
    }

    next_line() {
        this.line++
        this.column = 0
    }

    new_nl(): Token {
        return Token.new_token([this.line, this.column], TokenType.Next, '\n')
    }

    handle_space(): Token | void {
        switch (this.current.token_type) {
            case TokenType.Void:
                break
            case TokenType.SlComment:
            case TokenType.MlComment:
                this.current.content += ' '
                break
            case TokenType.MlString:
            case TokenType.String:
                this.current.content += ' '
                break
            default:
                return this.make_token(Token.void())
        }
    }

    handle_identifier(c: string): Token | void {
        switch (this.current.token_type) {
            case TokenType.Void:
                this.current = this.new_identifier(c)
                break
            case TokenType.SlComment:
            case TokenType.MlComment:
                this.current.content += c
                break
            case TokenType.Identifier:
                this.current.content += c
                break
            case TokenType.MlString:
            case TokenType.String:
                this.current.content += c
                break
            case TokenType.Integer:
                if (
                    this.current.content == '0' &&
                    (c == 'b' || c == 'x' || c == 'o')
                ) {
                    this.current.content += c
                } else {
                    throw new ErrorSyntax('invalid decimal literal')
                }
                break
            default:
                return this.make_token(this.new_identifier(c))
        }
    }

    new_identifier(c: string): Token {
        return Token.new_token(
            [this.line, this.column],
            TokenType.Identifier,
            c,
        )
    }

    handle_number(c: string): Token | void {
        switch (this.current.token_type) {
            case TokenType.Void:
                this.current = this.new_number(c)
                break
            case TokenType.SlComment:
            case TokenType.MlComment:
                this.current.content += c
                break
            case TokenType.Identifier:
            case TokenType.MlString:
            case TokenType.String:
            case TokenType.Integer:
            case TokenType.Float:
                this.current.content += c
                break
            case TokenType.Minus:
                if (
                    this.last.token_type != TokenType.Identifier &&
                    this.last.token_type != TokenType.Float &&
                    this.last.token_type != TokenType.Integer
                ) {
                    this.current.content += c
                    this.current.token_type = TokenType.Integer
                } else {
                    let t = this.make_token(this.new_number(c))
                    return t
                }
                break
            default:
                return this.make_token(this.new_number(c))
        }
    }

    new_number(c: string): Token {
        return Token.new_token([this.line, this.column], TokenType.Integer, c)
    }

    handle_underscore(): Token | void {
        switch (this.current.token_type) {
            case TokenType.Void:
                this.current = this.new_underscore()
                break
            case TokenType.Identifier:
                this.current.content += '_'
                break
            case TokenType.SlComment:
            case TokenType.MlComment:
                this.current.content += '_'
                break
            case TokenType.MlString:
            case TokenType.String:
                this.current.content += '_'
                break
            default:
                return this.make_token(this.new_underscore())
        }
    }

    new_underscore(): Token {
        return Token.new_token(
            [this.line, this.column],
            TokenType.Identifier,
            '_',
        )
    }

    handle_group_block(c: string): Token | void {
        switch (this.current.token_type) {
            case TokenType.Void:
                this.current = this.new_group_block(c)
                break
            case TokenType.SlComment:
            case TokenType.MlComment:
                this.current.content += c
                break
            case TokenType.MlString:
            case TokenType.String:
                this.current.content += c
                break
            default:
                return this.make_token(this.new_group_block(c))
        }
    }

    new_group_block(c: string): Token {
        let t = TokenType.Void
        if (c == '(') {
            t = TokenType.LeftParen
        } else if (c == ')') {
            t = TokenType.RightParen
        } else if (c == '{') {
            t = TokenType.LeftBrace
        } else if (c == '}') {
            t = TokenType.RightBrace
        } else if (c == '[') {
            t = TokenType.LeftBracket
        } else if (c == ']') {
            t = TokenType.RightBracket
        } else {
            t = TokenType.Void
        }
        return Token.new_token([this.line, this.column], t, c)
    }

    handle_operator(c: string): Token | void {
        switch (this.current.token_type) {
            case TokenType.Void:
                this.current = this.new_operator(c)
                break
            case TokenType.SlComment:
                this.current.content += c
                break
            case TokenType.MlComment:
                if (c == '/' && this.current.content.endsWith('*')) {
                    this.current.content += c
                    return this.make_token(Token.void())
                } else {
                    this.current.content += c
                }
                break
            case TokenType.MlString:
            case TokenType.String:
                this.current.content += c
                break
            case TokenType.Divide:
                if (c == '/') {
                    this.current.content += c
                    this.current.token_type = TokenType.SlComment
                } else if (c == '*') {
                    this.current.content += c
                    this.current.token_type = TokenType.MlComment
                } else {
                    return this.make_token(this.new_operator(c))
                }
                break
            default:
                return this.make_token(this.new_operator(c))
        }
    }

    new_operator(c: string): Token {
        let t = TokenType.Void
        if (c == '+') {
            t = TokenType.Plus
        } else if (c == '-') {
            t = TokenType.Minus
        } else if (c == '*') {
            t = TokenType.Multiply
        } else if (c == '/') {
            t = TokenType.Divide
        } else if (c == '%') {
            t = TokenType.Mod
        } else {
            t = TokenType.Void
        }
        return Token.new_token([this.line, this.column], t, c)
    }

    handle_assign(): Token | void {
        switch (this.current.token_type) {
            case TokenType.Void:
                this.current = this.new_assign()
                break
            case TokenType.SlComment:
            case TokenType.MlComment:
                this.current.content += '='
                break
            case TokenType.MlString:
            case TokenType.String:
                this.current.content += '='
                break
            case TokenType.Assign:
                this.current.content += '='
                this.current.token_type = TokenType.Equal
                break
            case TokenType.Not:
                this.current.content += '='
                this.current.token_type = TokenType.NotEqual
                break
            case TokenType.Greater:
                this.current.content += '='
                this.current.token_type = TokenType.GreaterEqual
                break
            case TokenType.Less:
                this.current.content += '='
                this.current.token_type = TokenType.LessEqual
                break
            default:
                return this.make_token(this.new_assign())
        }
    }

    new_assign(): Token {
        return Token.new_token([this.line, this.column], TokenType.Assign, '=')
    }

    handle_comma(): Token | void {
        switch (this.current.token_type) {
            case TokenType.Void:
                this.current = this.new_comma()
                break
            case TokenType.SlComment:
            case TokenType.MlComment:
                this.current.content += ','
                break
            case TokenType.MlString:
            case TokenType.String:
                this.current.content += ','
                break
            default:
                return this.make_token(this.new_comma())
        }
    }

    new_comma(): Token {
        return Token.new_token([this.line, this.column], TokenType.Comma, ',')
    }

    handle_colon(): Token | void {
        switch (this.current.token_type) {
            case TokenType.Void:
                this.current = this.new_colon()
                break
            case TokenType.SlComment:
            case TokenType.MlComment:
                this.current.content += ':'
                break
            case TokenType.MlString:
            case TokenType.String:
                this.current.content += ':'
                break
            default:
                return this.make_token(this.new_colon())
        }
    }

    new_colon(): Token {
        return Token.new_token([this.line, this.column], TokenType.Colon, ':')
    }

    handle_string(c: string): Token | void {
        switch (this.current.token_type) {
            case TokenType.Void:
                this.current = this.new_string()
                break
            case TokenType.SlComment:
            case TokenType.MlComment:
                this.current.content += c
                break
            case TokenType.MlString:
                this.current.content += c
                break
            case TokenType.String:
                return this.make_token(Token.void())
            default:
                return this.make_token(this.new_string())
        }
    }

    new_string(): Token {
        return Token.new_token([this.line, this.column], TokenType.String, '')
    }

    handle_mlstring(c: string): Token | void {
        switch (this.current.token_type) {
            case TokenType.Void:
                this.current = this.new_mlstring()
                break
            case TokenType.SlComment:
            case TokenType.MlComment:
                this.current.content += c
                break
            case TokenType.MlString:
                return this.make_token(Token.void())
            case TokenType.String:
                this.current.content += c
                break
            default:
                return this.make_token(this.new_mlstring())
        }
    }

    new_mlstring(): Token {
        return Token.new_token([this.line, this.column], TokenType.MlString, '')
    }

    handle_dot(): Token | void {
        switch (this.current.token_type) {
            case TokenType.Void:
                this.current = this.new_dot()
                break
            case TokenType.SlComment:
            case TokenType.MlComment:
                this.current.content += '.'
                break
            case TokenType.MlString:
            case TokenType.String:
                this.current.content += '.'
                break
            case TokenType.Integer:
                if (
                    this.current.content.startsWith('0x') ||
                    this.current.content.startsWith('0b') ||
                    this.current.content.startsWith('0o')
                ) {
                    throw new ErrorSyntax('Invalid float')
                }
                this.current.content += '.'
                this.current.token_type = TokenType.Float
                break
            default:
                return this.make_token(this.new_dot())
        }
    }

    new_dot(): Token {
        return Token.new_token([this.line, this.column], TokenType.Dot, '.')
    }

    handle_not(): Token | void {
        switch (this.current.token_type) {
            case TokenType.Void:
                this.current = this.new_not()
                break
            case TokenType.SlComment:
            case TokenType.MlComment:
                this.current.content += '!'
                break
            case TokenType.MlString:
            case TokenType.String:
                this.current.content += '!'
                break
            default:
                return this.make_token(this.new_not())
        }
    }

    new_not(): Token {
        return Token.new_token([this.line, this.column], TokenType.Not, '!')
    }

    handle_compare(c: string): Token | void {
        switch (this.current.token_type) {
            case TokenType.Void:
                this.current = this.new_compare(c)
                break
            case TokenType.SlComment:
            case TokenType.MlComment:
                this.current.content += c
                break
            case TokenType.MlString:
            case TokenType.String:
                this.current.content += c
                break
            case TokenType.Less:
                if (c == '<') {
                    this.current.content += c
                    this.current.token_type = TokenType.LeftShift
                } else {
                    throw new ErrorSyntax('invalid compare operator')
                }
                break
            case TokenType.Greater:
                if (c == '>') {
                    this.current.content += c
                    this.current.token_type = TokenType.RightShift
                } else {
                    throw new ErrorSyntax('invalid compare operator')
                }
                break
            default:
                return this.make_token(this.new_compare(c))
        }
    }

    new_compare(c: string): Token {
        if (c == '<') {
            return Token.new_token([this.line, this.column], TokenType.Less, c)
        } else if (c == '>') {
            return Token.new_token(
                [this.line, this.column],
                TokenType.Greater,
                c,
            )
        } else {
            return Token.new_token([this.line, this.column], TokenType.Void, c)
        }
    }
}

export { Token, Lexer, TokenType }
