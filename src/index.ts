import { Arguments } from './cli/argument'

const main = async () => {
    let args = Arguments.parse()
    args.run()
}

main()
