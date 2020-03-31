
import { run } from './cmd'


export const buildImage = async (serviceName, protoSourcePath) => {

  return await run([
    'docker',
    'build'
  ].join(' '))

}
