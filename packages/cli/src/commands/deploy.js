import * as fse from 'fs-extra'
import * as _ from 'lodash'

import * as core from '~manifest/core'


const START_PORT = 9000
const END_PORT = 9050

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

  console.log('deploying...')

  const serviceNames = await core.fs.listDirectories('./.manifest/build')

  const services = serviceNames.map(name => ({
    serviceName: name,
    serviceClassName: core.str.toPascalCase(`${name}-service`),
    imageName: `manifest-service-${name}`,
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
      hostname: `manifest-service-${name}`,
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
