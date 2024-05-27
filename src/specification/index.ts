const KEYWORDS = [
    'mod',
    'pub',
    'use',
    'as',
    'class',
    'async',
    'await',
    'fn',
    'return',
    'if',
    'else',
    'for',
    'while',
    'loop',
    'continue',
    'break',
    'true',
    'false',
]

class Area {
    start: [number, number]
    end: [number, number]

    constructor(start: [number, number], end: [number, number]) {
        this.start = start
        this.end = end
    }

    static init() {
        return new Area([0, 0], [0, 0])
    }

    toString(): string {
        return `${this.start[0]},${this.start[1]} - ${this.end[0]},${this.end[1]}`
    }
}

enum Precedence {
    Lowest,
    Assign, // =, +=, -=, *=, /=, %=, &=, |=, ^=, >>=, <<=
    Logic, // &, |, ^, &&, ||
    Ternary, // ?, :
    Compare, // ==, !=, <, <=, >, >=
    Term, // +, -
    Factor, // *, /, %
    Power, // **
    Prefix, // ++x, --x, +x, -x, !x
    Call, // function(x)
    Index, // list[index]
    Dot, // object.property, object.function()
}

enum ExprType {
    Prefix,
    Infix,
    Postfix,
}

export { Area, ExprType, Precedence, KEYWORDS }
