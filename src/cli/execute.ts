import { Compiler, Runtime, VirtualMachine } from '../lib'

const path = require('path')
const fs = require('fs')

const build = (script: string) => {
    let word_dir = process.cwd()

    let filepath = path.join(word_dir, script)

    if (!fs.existsSync(filepath) || !fs.statSync(filepath).isFile()) {
        console.log(`No such file: ${filepath}`)
        return
    }

    let filename = path.basename(filepath)
    let ext = path.extname(filename)
    let without_ext = filename.slice(0, -ext.length)
    let output = path.join(word_dir, `${without_ext}.ac`)

    let code = fs.readFileSync(filepath, 'utf-8')
    let bytecode = Compiler.build(code)

    fs.writeFileSync(output, bytecode)
}

const run = (script: string, args: string[]) => {
    let word_dir = process.cwd()

    let filepath = path.join(word_dir, script)

    if (!fs.existsSync(filepath) || !fs.statSync(filepath).isFile()) {
        console.log(`No such file: ${filepath}`)
        return
    }

    let filename = path.basename(filepath)
    let ext = path.extname(filename)
    let without_ext = filename.slice(0, -ext.length)
    let output = path.join(word_dir, `${without_ext}.ac`)

    if (fs.existsSync(output) && fs.statSync(output).isFile()) {
        let sourceMetadata = fs.statSync(filepath)
        let sourceModified = sourceMetadata.mtime
        let bytecodeMetadata = fs.statSync(output)
        let bytecodeModified = bytecodeMetadata.mtime

        if (bytecodeModified.getTime() > sourceModified.getTime()) {
            // let bytecode = fs.readFileSync(output)
            // VirtualMachine.execute(bytecode, args)
            let code = fs.readFileSync(filepath, 'utf-8')
            VirtualMachine.interpret(code, args)
        } else {
            let code = fs.readFileSync(filepath, 'utf-8')
            VirtualMachine.interpret(code, args)
        }
    } else {
        let code = fs.readFileSync(filepath, 'utf-8')
        VirtualMachine.interpret(code, args)
    }
}

export { build, run }
