
import * as yargs from 'yargs'

import * as core from './core'
import build from './commands/build'
import deploy from './commands/deploy'


const test = args => {
  console.log('!! TEST !!')
  console.log(args)
}


const cli = (args) => {

  yargs
    .command('build', 'Execute the build', {

    }, build)
    .command('deploy', 'Deploy...', {

    }, deploy)
    .command('test', 'Testing...', {

    }, test)
    .options({
      'manifesto': {
        alias: 'm',
        demandOption: false,
        describe: 'A path to a manifest config file to use',
        type: 'string'
      }
    })
    .middleware([core.config.loadManifesto])
    .help()
    .parse(args)

}

export default cli
