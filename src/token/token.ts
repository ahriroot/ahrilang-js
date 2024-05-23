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

    Plus, // +
    Minus, // -
    Multiply, // *
    Divide, // /
    Mod, // %
    Power, // **

    Comma, // ,
    Colon, // :

    LeftParen, // (
    RightParen, // )
    LeftBrace, // {
    RightBrace, // }
    Assign, // =
    Equal, // ==
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
}

export { Token, TokenType }
