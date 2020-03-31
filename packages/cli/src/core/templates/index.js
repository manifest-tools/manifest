import * as fse from 'fs-extra'
import * as mustache from 'mustache'
import { anyToSnakeCase } from './../str'


// Bypass mustache's auto html encoding
mustache.escape = x => x

const relPath = fileName => `${__dirname}/${fileName}`

const template = async (filePath, data) => {
  const t = await fse.readFile(filePath, 'utf8')
  const snake_data = anyToSnakeCase(data)
  return mustache.render(t, snake_data)
}

export const dockerCompose = async ({
  services,
  manifestConfig
}) => await template(relPath('docker-compose.template.yml'), { services, manifestConfig })

export const serverIndex = async ({
  serverPath
}) => await template(relPath('server-index.template.js'), { serverPath })
