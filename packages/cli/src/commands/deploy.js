import * as fse from 'fs-extra'
import * as _ from 'lodash'

import * as core from './../core'


const START_PORT = 9000
const END_PORT = 9050

const print = x => console.log(x)

const ports = (() => {

  function * portGen() {
    const ports = [...Array(END_PORT - START_PORT).keys()].map(i => START_PORT + i)
    for (const port of ports) {
      yield port
    }
  }

  const iterPorts = portGen()

  return {
    next: () => iterPorts.next().value
  }

})()



const deploy = async ({
  manifesto
}) => {

  const { project: { name: projectName } } = manifesto

  print(`deploying ${projectName}...`)

  const serviceNames = await core.fs.listDirectories('./.manifest')

  const services = serviceNames.map(name => ({
    serviceName: name,
    serviceClassName: core.str.toPascalCase(`${name}-service`),
    imageName: `manifest-service-${projectName}-${name}`,
    ports: {
      rest: {
        container: '5000',
        host: ports.next()
      },
      grpc: {
        container: '50051',
        host: ports.next()
      }
    },
    network: {
      hostname: `manifest-service-${projectName}-${name}`,
      port: '50051'
    }
  }))

  const manifestConfig = {
    serviceMap: services.reduce((acc, s) => ({
      ...acc,
      [s.serviceClassName]: {
        ...s.network
      }
    }), {})
  }

  const dockerCompose = await core.templates.dockerCompose({
    services,
    manifestConfig: JSON.stringify(JSON.stringify(manifestConfig))
  })

  await fse.writeFile('./.manifest/docker-compose.yml', dockerCompose, 'utf8')

  const cmd = `docker-compose -f ./.manifest/docker-compose.yml up`
  await core.cmd.run(cmd)

}

export default deploy
