import { Area, ExprType } from '../specification'
import { Precedence } from '../specification'

class Metadata {
    area: Area
    precedence: Precedence
    expr: ExprType

    constructor(area: Area, precedence: Precedence, expr: ExprType) {
        this.area = area
        this.precedence = precedence
        this.expr = expr
    }

    static create() {
        return new Metadata(Area.init(), Precedence.Lowest, ExprType.Prefix)
    }
}

enum TokenType {
    Void,
    Keyword,
    Identifier, // a, b, c

    // constant
    Integer, // 1, 2, 3
    Float, // 1.0, 2.0, 3.0
    String, // xxxxxxx
    Boolean, // true, false

    Not, // !
    Plus, // +
    Minus, // -
    Multiply, // *
    Divide, // /
    Mod, // %
    LeftShift, // <<
    RightShift, // >>
    Power, // **

    Comma, // ,
    Colon, // :

    Equal, // ==
    Greater, // >
    GreaterEqual, // >=
    Less, // <
    LessEqual, // <=
    NotEqual, // !=

    LeftParen, // (
    RightParen, // )
    LeftBrace, // {
    RightBrace, // }
    Assign, // =
    Dot, // .

    SlComment, // //
    MlComment, // /** */

    Next,
    MlString,
    Sof,
    Eof,
}

class Token {
    metadata: Metadata
    token_type: TokenType
    content: string

    constructor(metadata: Metadata, token_type: TokenType, content: string) {
        this.metadata = metadata
        this.token_type = token_type
        this.content = content
    }

    static new_token(
        start: [number, number],
        token_type: TokenType,
        content: string,
    ) {
        return new Token(
            new Metadata(
                new Area(start, [0, 0]),
                Precedence.Lowest,
                ExprType.Prefix,
            ),
            token_type,
            content,
        )
    }

    static void() {
        return new Token(
            new Metadata(
                new Area([0, 0], [0, 0]),
                Precedence.Lowest,
                ExprType.Prefix,
            ),
            TokenType.Void,
            '',
        )
    }

    toString(): string {
        switch (this.token_type) {
            case TokenType.Void:
                return `<Void: ${this.content}>`
            case TokenType.Keyword:
                return `<Keyword: ${this.content} ${this.metadata.area.toString()}>`
            case TokenType.Identifier:
                return `<Identifier: ${this.content}>`
            case TokenType.Integer:
                return `<Integer: ${this.content}>`
            case TokenType.Float:
                return `<Float: ${this.content}>`
            case TokenType.String:
                return `<String: ${this.content}>`
            case TokenType.Boolean:
                return `<Boolean: ${this.content}>`
            case TokenType.Not:
                return `<Not>`
            case TokenType.Plus:
                return `<Plus>`
            case TokenType.Minus:
                return `<Minus>`
            case TokenType.Multiply:
                return `<Multiply>`
            case TokenType.Divide:
                return `<Divide>`
            case TokenType.Mod:
                return `<Mod>`
            case TokenType.LeftShift:
                return `<LeftShift>`
            case TokenType.RightShift:
                return `<RightShift>`
            case TokenType.Power:
                return `<Power>`
            case TokenType.Comma:
                return `<Comma>`
            case TokenType.Colon:
                return `<Colon>`
            case TokenType.Equal:
                return `<Equal>`
            case TokenType.Greater:
                return `<Greater>`
            case TokenType.GreaterEqual:
                return `<GreaterEqual>`
            case TokenType.Less:
                return `<Less>`
            case TokenType.LessEqual:
                return `<LessEqual>`
            case TokenType.NotEqual:
                return `<NotEqual>`
            case TokenType.LeftParen:
                return `<LeftParen>`
            case TokenType.RightParen:
                return `<RightParen>`
            case TokenType.LeftBrace:
                return `<LeftBrace>`
            case TokenType.RightBrace:
                return `<RightBrace>`
            case TokenType.Assign:
                return `<Assign>`
            case TokenType.Dot:
                return `<Dot>`
            case TokenType.SlComment:
                return `<SlComment>`
            case TokenType.MlComment:
                return `<MlComment>`
            case TokenType.Next:
                return `<Next> ${this.metadata.area.start}`
            case TokenType.MlString:
                return `<MlString>`
            case TokenType.Sof:
                return `<Sof>`
            case TokenType.Eof:
                return `<Eof>`
        }
    }
}

export { Token, TokenType }
