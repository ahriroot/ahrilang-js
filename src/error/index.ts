class ErrorBase extends Error {
    description: string
    constructor(msg: string) {
        super(msg)
        this.name = 'ErrorBase'
        this.description = 'ErrorBase'
    }

    hash(): symbol {
        return Symbol(
            this.description +
                this.message +
                this.stack +
                this.name +
                Math.random().toString(),
        )
    }
}

class ErrorSystem extends ErrorBase {
    description: string
    constructor(msg: string) {
        super(msg)
        this.name = 'SystemError'
        this.description = 'SystemError'
    }
}

class ErrorSyntax extends ErrorBase {
    description: string
    constructor(msg: string) {
        super(msg)
        this.name = 'SyntaxError'
        this.description = 'SyntaxError'
    }
}

class ErrorType extends ErrorBase {
    description: string
    constructor(msg: string) {
        super(msg)
        this.name = 'TypeError'
        this.description = 'TypeError'
    }
}

class ErrorException extends ErrorBase {
    description: string
    constructor(msg: string) {
        super(msg)
        this.name = 'Exception'
        this.description = 'Exception'
    }
}

class ErrorRuntime extends ErrorBase {
    description: string
    constructor(msg: string) {
        super(msg)
        this.name = 'ErrorRuntime'
        this.description = 'ErrorRuntime'
    }
}

export {
    ErrorBase,
    ErrorSystem,
    ErrorSyntax,
    ErrorType,
    ErrorException,
    ErrorRuntime,
}
