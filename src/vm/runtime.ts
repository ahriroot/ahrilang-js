class Runtime {
    args: string[]
    envs: { [x: string]: string | undefined }
    builtins: { [x: string]: any } | undefined

    constructor(
        args: string[],
        builtins: { [x: string]: any } | undefined = undefined,
    ) {
        this.args = args
        this.envs = {}
        this.builtins = builtins

        if (typeof window !== 'undefined') {
            for (let key in window) {
                this.envs[key] = (window as any)[key]
            }
        } else {
            for (let key in process.env) {
                this.envs[key] = process.env[key]
            }
        }
    }
}

export { Runtime }
