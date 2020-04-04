import * as fse from 'fs-extra'
import * as _ from 'lodash'

import * as core from '~manifest/core'
import protoc from './core/protoc'


const loadArtifact = async (name) => await fse.readFile(`${__dirname}/artifacts/${name}`, 'utf8')

const grpcServer = await loadArtifact('grpc_server.py')
const grpcRelay = await loadArtifact('grpc_relay.py')
const dockerfile = await loadArtifact('Dockerfile')
const restServer = await loadArtifact('rest_server.py')
const serviceMeta = await loadArtifact('service_meta.py')

const build = async ({ manifesto }) => {

  const PROJECT_ROOT_DIR = manifesto.project.root
  const PROJECT_SERVICE_DIR = manifesto.project.services
  const PROJECT_CORE_DIR = manifesto.project.core
  const PROJECT_ROOT_DIR_NAME = manifesto.project.root.split('/').slice(-1)[0]

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

  const requirementsFile = await fse.readFile('./requirements.txt', 'utf8')

  const services = await core.fs.listDirectories(PROJECT_SERVICE_DIR)

  for (const service of services) {

    const servicePath = `./.manifest/build/${service}`
    const serviceRootPath = `./.manifest/build/${service}/${PROJECT_ROOT_DIR_NAME}`

    // gRPC
    console.log(`1. Assembling ${service} gRPC service`)
    await fse.ensureDir(serviceRootPath)
    await fse.copy(PROJECT_ROOT_DIR, serviceRootPath)
    await fse.move(`${serviceRootPath}/services/${service}/${service}.py`, `${serviceRootPath}/services/${service}/service.py`)
    await fse.move(`${serviceRootPath}/services/${service}/${service}.proto`, `${serviceRootPath}/services/${service}/service.proto`)
    await fse.writeFile(`${serviceRootPath}/services/${service}/server.py`, grpcServer, 'utf8')
    await fse.writeFile(`${serviceRootPath}/services/${service}/service_meta.py`, serviceMeta, 'utf8')


    // Rest
    console.log(`2. Assembling ${service} REST service`)
    await fse.writeFile(`${serviceRootPath}/services/${service}/rest.py`, restServer, 'utf8')
    // const restServerIndex = await core.templates.serverIndex({ serverPath: `./src/services/${service}/rest` })
    // await fse.writeFile(`./.manifest/build/${service}/rest.js`, restServerIndex, 'utf8')

    // Docker & Dependent Files
    console.log(`3. Assembling ${service} Dockerfile`)
    await fse.writeFile(`${servicePath}/Dockerfile`, dockerfile, 'utf8')
    await fse.writeFile(`${servicePath}/requirements.txt`, requirementsFile, 'utf8')

    // Generating Protocol Buffer Files
    console.log(`4. Assembling ${service} protocol buffer files`)
    const relPath = core.path.removeOverlap(`${serviceRootPath}/services/${service}/service.proto`, `./.manifest/build/${service}`)
    await protoc.generate(`.${relPath}`, `./.manifest/build/${service}`)

  }


  for (const service of services) {

    const serviceRootPath = `./.manifest/build/${service}/${PROJECT_ROOT_DIR_NAME}`

    // Get all the other services...
    const otherServices = services.filter(s => s !== service)

    // And copy their service file into your directory
    // Ex. copy(user/service.js, order/user.js) + directory & index
    console.log(`5. Assembling ${service} realys for other services`)
    for (const otherService of otherServices) {
      await fse.move(`${serviceRootPath}/services/${otherService}/${otherService}.proto`, `${serviceRootPath}/services/${otherService}/service.proto`)
      await fse.writeFile(`${serviceRootPath}/services/${otherService}/${otherService}.py`, grpcRelay, 'utf8')
    }


    console.log(`6. Building docker image for ${service} service`)
    const cmd = `docker build --tag manifest-service-${service} --rm -f ./.manifest/build/${service}/Dockerfile ./.manifest/build/${service}`
    // await core.cmd.run(cmd)

  }

  return /** DEBUG **/

}

const buildGrpcService = async (serviceName, servicePyFile, serviceProtoFile) => {
  const grpcServer = await loadArtifact('grpc_server.py')
  const grpcRelay = await loadArtifact('grpc_relay.py')
  const serviceMeta = await loadArtifact('service_meta.py')
  const { pb2, pb2Grpc } = await createProtoBuffers(serviceProtoFile)
  return {
    'server.py': grpcServer,
    'service.py': servicePyFile,
    `${serviceName}.py`: grpcRelay,
    'service_meta.py': serviceMeta,
    'service_pb2_grpc.py': pb2Grpc,
    'service_pb2.py': pb2,
    'service.proto': serviceProtoFile
  }
}

const loadService = async (servicesDir, serviceName) => {
  const service = await fse.readFile(`${servicesDir}/${serviceName}/${serviceName}.py`, 'utf8')
  const proto = await fse.readFile(`${servicesDir}/${serviceName}/${serviceName}.proto`, 'utf8')
  return { service, proto }
}

//
// const buildGrpcService = (serviceDir, serviceName) => {
//
//   const renameService = name => await fse.move(`${serviceRootPath}/services/${service}/${service}.py`, `${serviceRootPath}/services/${service}/${name}.py`)
//   await fse.move(`${serviceRootPath}/services/${service}/${service}.proto`, `${serviceRootPath}/services/${service}/service.proto`)
//   await fse.writeFile(`${serviceRootPath}/services/${service}/server.py`, grpcServer, 'utf8')
//   await fse.writeFile(`${serviceRootPath}/services/${service}/service_meta.py`, serviceMeta, 'utf8')
//
//   // Rest
//   console.log(`2. Assembling ${service} REST service`)
//   await fse.writeFile(`${serviceRootPath}/services/${service}/rest.py`, restServer, 'utf8')
//   // const restServerIndex = await core.templates.serverIndex({ serverPath: `./src/services/${service}/rest` })
//   // await fse.writeFile(`./.manifest/build/${service}/rest.js`, restServerIndex, 'utf8')
//
//   // Docker & Dependent Files
//   console.log(`3. Assembling ${service} Dockerfile`)
//   await fse.writeFile(`${servicePath}/Dockerfile`, dockerfile, 'utf8')
//   await fse.writeFile(`${servicePath}/requirements.txt`, requirementsFile, 'utf8')
//
//   // Generating Protocol Buffer Files
//   console.log(`4. Assembling ${service} protocol buffer files`)
//   const relPath = core.path.removeOverlap(`${serviceRootPath}/services/${service}/service.proto`, `./.manifest/build/${service}`)
//   await protoc.generate(`.${relPath}`, `./.manifest/build/${service}`)
//
// }

const createProtoBuffers = async protoFile => {
  await fse.writeFile(`./.manifest/tmp/service.proto`, protoFile, 'utf8')
  await protoc.generate(`./.manifest/tmp/service.proto`, `./.manifest/tmp`)
  const pb2 = await fse.readFile(`./.manifest/tmp/service_pb2.py`, 'utf8')
  const pb2Grpc = await fse.readFile(`./.manifest/tmp/service_pb2_grpc.py`, 'utf8')
  return { pb2, pb2Grpc }
}


export default build
