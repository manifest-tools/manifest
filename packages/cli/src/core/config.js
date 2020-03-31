import * as fse from 'fs-extra'
import YAML from 'yaml'


const DEFAULT_MANIFESTO = {

}


export const loadManifesto = async argv => {
  const { manifesto: path } = argv

  if (!path) {
    console.warn('No manifesto file was specified - using default values')
    argv.manifesto = DEFAULT_MANIFESTO
    return
  }

  const file = await fse.readFile(path, 'utf8')
  argv.manifesto = YAML.parse(file)

}
