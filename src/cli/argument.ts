import { VERSION } from '../lib'
import { build, run } from './execute'

class Commands {
    run() {
        throw new Error('Method not implemented.')
    }
}

class Build extends Commands {
    script: string | null
    help: boolean
    constructor() {
        super()
        this.script = null
        this.help = false
    }

    helpMessage(): string {
        return `Usage: ahrilang build [OPTIONS] <script>

Options:
    -h, --help      Print help

Arguments:
    <script>        Script to build

Version ${VERSION}`
    }

    run() {
        if (this.help) {
            console.log(this.helpMessage())
            return
        }

        if (this.script === null) {
            console.log(this.helpMessage())
            return
        }

        build(this.script)
    }
}

class Run extends Commands {
    script: string | null
    help: boolean
    other: string[]
    constructor() {
        super()
        this.script = null
        this.help = false
        this.other = []
    }

    helpMessage(): string {
        return `Usage: ahrilang run [OPTIONS] <script>

Options:
    -h, --help      Print help

Arguments:
    <script>        Script to run

Version ${VERSION}`
    }

    run() {
        if (this.help) {
            console.log(this.helpMessage())
            return
        }

        if (this.script === null) {
            console.log(this.helpMessage())
            return
        }

        run(this.script, this.other)
    }
}

class Add extends Commands {
    name: string | null
    help: boolean
    constructor() {
        super()
        this.name = null
        this.help = false
    }

    helpMessage(): string {
        return `Usage: ahrilang add [OPTIONS] <script>

Options:
    -h, --help      Print help

Arguments:
    <name>          Package to add

Version ${VERSION}`
    }

    run() {
        if (this.help) {
            console.log(this.helpMessage())
            return
        }

        if (this.name === null) {
            console.log(this.helpMessage())
            return
        }

        // TODO: add dependency
    }
}

class Arguments {
    args: string[]
    script: string | null
    help: boolean
    version: boolean
    commands: Commands | null
    constructor() {
        let args = process.argv.reverse()
        args.pop()
        args.pop()

        this.args = args
        this.script = null
        this.help = false
        this.version = false
        this.commands = null
    }

    static parse(): Arguments {
        let args = new Arguments()
        args.parseRoot()
        return args
    }

    parseRoot() {
        let arg = this.args.pop()
        f: while (arg !== undefined) {
            switch (arg) {
                case '-h':
                case '--help':
                    this.help = true
                    break
                case '-v':
                case '--version':
                    this.version = true
                    break
                case 'build':
                    this.parseBuild()
                    break f
                case 'run':
                    this.parseRun()
                    break f
                case 'add':
                    this.parseAdd()
                    break f
                default:
                    this.script = arg
                    break
            }
            arg = this.args.pop()
        }
    }

    parseBuild() {
        let build = new Build()
        let arg = this.args.pop()
        f: while (arg !== undefined) {
            switch (arg) {
                case '-h':
                case '--help':
                    build.help = true
                    break
                default:
                    build.script = arg
                    break f
            }
            arg = this.args.pop()
        }
        this.commands = build
    }

    parseRun() {
        let run = new Run()
        let arg = this.args.pop()
        f: while (arg !== undefined) {
            switch (arg) {
                case '-h':
                case '--help':
                    run.help = true
                    break
                default:
                    run.script = arg
                    run.other = this.args.reverse()
                    break f
            }
            arg = this.args.pop()
        }
        this.commands = run
    }

    parseAdd() {
        let add = new Add()
        let arg = this.args.pop()
        f: while (arg !== undefined) {
            switch (arg) {
                case '-h':
                case '--help':
                    add.help = true
                    break
                default:
                    add.name = arg
                    break f
            }
            arg = this.args.pop()
        }
        this.commands = add
    }

    helpMessage(): string {
        return `Usage: ahrilang [COMMAND|OPTIONS] <script>

Commands:
    build [OPTIONS] <script>
    run   [OPTIONS] <script>

Options:
    -h, --help      Print help
    -v, --version   Print version

Arguments:
    <script>        Script to run

Version ${VERSION}`
    }

    run() {
        if (this.help) {
            console.log(this.helpMessage())
            return
        }

        if (this.version) {
            console.log(`ahrilang ${VERSION}`)
            return
        }

        if (this.commands !== null) {
            this.commands.run()
        }
    }
}

export { Arguments }
