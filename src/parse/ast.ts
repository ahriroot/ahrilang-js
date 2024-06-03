import { Token } from '../token'

class Expression {
    type: string = ''
    hash(): symbol {
        return Symbol.for(this.toString())
    }
}

class Program extends Expression {
    expressions: Expression[]
    type = 'Program'

    constructor(expressions: Expression[]) {
        super()
        this.expressions = expressions
    }
}

class Use extends Expression {
    name: Token
    path: Token[]
    type = 'Use'

    constructor(name: Token, path: Token[]) {
        super()
        this.name = name
        this.path = path
    }
}

class Statements extends Expression {
    expressions: Expression[]
    type = 'Statements'

    constructor(expressions: Expression[]) {
        super()
        this.expressions = expressions
    }
}

class AsyncFunction extends Expression {
    name: Token
    args: Token[]
    annotation: Token[]
    body: Expression[]
    type = 'AsyncFunction'

    constructor(
        name: Token,
        args: Token[],
        annotation: Token[],
        body: Expression[],
    ) {
        super()
        this.name = name
        this.args = args
        this.annotation = annotation
        this.body = body
    }
}

class Function extends Expression {
    name: Token
    args: Token[]
    annotation: Token[]
    body: Expression[]
    type = 'Function'

    constructor(
        name: Token,
        args: Token[],
        annotation: Token[],
        body: Expression[],
    ) {
        super()
        this.name = name
        this.args = args
        this.annotation = annotation
        this.body = body
    }
}

class Return extends Expression {
    expression: Expression
    type = 'Return'

    constructor(expression: Expression) {
        super()
        this.expression = expression
    }
}

class Call extends Expression {
    token: Token
    expressions: Expression[]
    type = 'Call'

    constructor(token: Token, expressions: Expression[]) {
        super()
        this.token = token
        this.expressions = expressions
    }
}

class Await extends Expression {
    token: Token
    expressions: Expression[]
    type = 'Await'

    constructor(token: Token, expressions: Expression[]) {
        super()
        this.token = token
        this.expressions = expressions
    }
}

class Integer extends Expression {
    value: number
    type = 'Integer'

    constructor(value: number) {
        super()
        this.value = value
    }
}

class String extends Expression {
    token: Token
    value: string
    type = 'String'

    constructor(token: Token, value: string) {
        super()
        this.token = token
        this.value = value
    }
}

class Boolean extends Expression {
    token: Token
    value: boolean
    type = 'Boolean'

    constructor(token: Token, value: boolean) {
        super()
        this.token = token
        this.value = value
    }
}

class Identifier extends Expression {
    token: Token
    type = 'Identifier'

    constructor(token: Token) {
        super()
        this.token = token
    }
}

class Infix extends Expression {
    left: Expression
    right: Expression
    operator: Token
    type = 'Infix'

    constructor(left: Expression, right: Expression, operator: Token) {
        super()
        this.left = left
        this.right = right
        this.operator = operator
    }
}

class Statement extends Expression {
    expression: Expression
    type = 'Statement'

    constructor(expression: Expression) {
        super()
        this.expression = expression
    }
}

class If extends Expression {
    condition: Expression
    consequence: Expression[]
    alternative: Expression[]
    type = 'If'

    constructor(
        condition: Expression,
        consequence: Expression[],
        alternative: Expression[],
    ) {
        super()
        this.condition = condition
        this.consequence = consequence
        this.alternative = alternative
    }
}

class Loop extends Expression {
    consequence: Expression[]
    type = 'Loop'

    constructor(consequence: Expression[]) {
        super()
        this.consequence = consequence
    }
}

class While extends Expression {
    condition: Expression
    consequence: Expression[]
    type = 'While'

    constructor(condition: Expression, consequence: Expression[]) {
        super()
        this.condition = condition
        this.consequence = consequence
    }
}

class Continue extends Expression {
    type = 'Continue'

    constructor() {
        super()
    }
}

class Break extends Expression {
    expression: Expression | null
    type = 'Break'

    constructor(expression: Expression | null) {
        super()
        this.expression = expression
    }
}

class List extends Expression {
    expressions: Expression[]
    type = 'List'

    constructor(expressions: Expression[]) {
        super()
        this.expressions = expressions
    }
}

class Map extends Expression {
    expressions: Expression[]
    type = 'Map'

    constructor(expressions: Expression[]) {
        super()
        this.expressions = expressions
    }
}

export {
    Expression,
    Program,
    Use,
    Statements,
    AsyncFunction,
    Function,
    Return,
    Call,
    Await,
    Integer,
    String,
    Boolean,
    Identifier,
    Infix,
    Statement,
    If,
    Loop,
    While,
    Continue,
    Break,
    List,
    Map,
}
