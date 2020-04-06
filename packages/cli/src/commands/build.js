import * as fse from 'fs-extra'
import * as _ from 'lodash'

import * as core from '~manifest/core'


const build = async ({
  manifesto,
  debug = false
}) => {

  /**
  * 0. Ensure build directory exists
  * 1. Copy all resources (services & core) into ./.manifest build dir
  * 2. For every service, build the required modules
  *      - MGC (Manifest gRPC Client)
  *      - MGS (Manifest gRPC Server)
  *      - MSD (Manifest Service Dispatcher)
  * 3. For every service, build a directory containing all the needed
  *    resources to build the microservice for that service
  *      - the MGS (server) for the service
  *      - all MGC (client) for other services
  *      - all MSD (grpc service) for other services
  *      - core module
  *      - any service specific modules
  * 4. Create docker images
  **/

  /**
  * 0
  **/
  // Clean up previous build dir if exists
  console.log('0. Cleaning manifest build directory')
  await fse.remove('./.manifest')
  await fse.ensureDir('./.manifest')

  /**
  * 1
  **/

  /** 1.5 => Override package.json with our own properties **/

  const partialPackageFile = await core.assets.partialPackageJson()
  const packageFile = await fse.readFile('./package.json', 'utf8')
  const partialPackage = JSON.parse(partialPackageFile)
  const packageJson = JSON.parse(packageFile)
  const mergedPackage = _.merge(packageJson, partialPackage)


  /**
  * 2
  **/

  const grpcClient = await core.assets.grpcClient()
  const grpcServer = await core.assets.grpcServer()
  const grpcRelay = await core.assets.grpcRelay()
  const grpcIndex = await core.assets.grpcIndex()
  const dockerfile = await core.assets.dockerfile()
  const restServer = await core.assets.restServer()

  const services = await core.fs.listDirectories(`./src/services`)

  for (const service of services) {

    // gRPC
    console.log(`1. Assembling ${service} gRPC service`)
    await fse.ensureDir(`./.manifest/build/${service}/src`)
    await fse.copy('./src', `./.manifest/build/${service}/src`)
    await fse.writeFile(`./.manifest/build/${service}/package.json`, JSON.stringify(mergedPackage, null, 2), 'utf8')
    const grpServerIndex = await core.templates.serverIndex({ serverPath: `./src/services/${service}/server` })
    await fse.writeFile(`./.manifest/build/${service}/grpc.js`, grpServerIndex, 'utf8')
    await fse.writeFile(`./.manifest/build/${service}/src/services/${service}/server.js`, grpcServer, 'utf8')
    await fse.move(`./.manifest/build/${service}/src/services/${service}/${service}.js`, `./.manifest/build/${service}/src/services/${service}/service.js`)
    await fse.move(`./.manifest/build/${service}/src/services/${service}/${service}.proto`, `./.manifest/build/${service}/src/services/${service}/service.proto`)

    // Rest
    console.log(`2. Assembling ${service} REST service`)
    await fse.writeFile(`./.manifest/build/${service}/src/services/${service}/rest.js`, restServer, 'utf8')
    const restServerIndex = await core.templates.serverIndex({ serverPath: `./src/services/${service}/rest` })
    await fse.writeFile(`./.manifest/build/${service}/rest.js`, restServerIndex, 'utf8')

    // Docker
    console.log(`3. Assembling ${service} Dockerfile`)
    await fse.writeFile(`./.manifest/build/${service}/Dockerfile`, dockerfile, 'utf8')

    // Get all the other services...
    const otherServices = services.filter(s => s !== service)

    // And copy their service file into your directory
    // Ex. copy(user/service.js, order/user.js) + directory & index
    console.log(`4. Assembling ${service} realys for other services`)
    for (const otherService of otherServices) {
      await fse.move(`./.manifest/build/${service}/src/services/${otherService}/${otherService}.proto`, `./.manifest/build/${service}/src/services/${otherService}/service.proto`)
      await fse.writeFile(`./.manifest/build/${service}/src/services/${otherService}/client.js`, grpcClient, 'utf8')
      await fse.writeFile(`./.manifest/build/${service}/src/services/${otherService}/${otherService}.js`, grpcRelay, 'utf8')
    }

    console.log(`5. Building docker image for ${service} service`)
    const cmd = `docker build --tag manifest-service-${service} --rm -f ./.manifest/build/${service}/Dockerfile ./.manifest/build/${service}`
    await core.cmd.run(cmd)

  }


}

export default build
