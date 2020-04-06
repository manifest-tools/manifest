import * as fse from 'fs-extra'
import * as _ from 'lodash'

import * as core from '~manifest/core'
import protoc from './core/protoc'


const print = x => console.log(x)

const build = async ({ manifesto }) => {

  await cleanWorkingDirectory(manifesto)

  const serviceMap = await buildGlobalFiles(
                       await buildRestFiles(
                         await buildGrpcFiles(
                           await loadSourceFiles(
                             await buildServiceMap(manifesto)))))

  const buildImages = async serviceMap => await buildDockerImages(manifesto, serviceMap)
  const writeServiceMeta = async serviceMap => await writeServiceMetaJson(manifesto, serviceMap)

  await buildImages(
    await writeServiceMeta(
      await writeRootFiles(
        await writeRestFiles(
          await writeRelayGrpcFiles(
            await writeActiveGrpcFiles(
              await copySourceFilesToBuildDirectory(
                await writeBuildDirectoriesForServices(serviceMap, manifesto))))))))

}

const loadArtifact = async (name) => await fse.readFile(`${__dirname}/artifacts/${name}`, 'utf8')


const buildDockerImages = async (manifesto, serviceMap) => {

  const { project: { name: projectName } } = manifesto

  const buildImage = async (service, buildPath) => {
    const cmd = `docker build --tag manifest-service-${projectName}-${service} --rm -f ${buildPath}/Dockerfile ${buildPath}`
    // print('skipping docker build...')
    await core.cmd.run(cmd)
  }

  await Promise.all(Object.keys(serviceMap.services).map(async service => {
    const { paths: { buildRoot } } = serviceMap.services[service]
    await buildImage(service, buildRoot)
  }))

  return serviceMap

}

const writeFileMap = async fileMap => {
  for (let [path, file] of Object.entries(fileMap)) {
    await fse.writeFile(path, file, 'utf8')
  }
}

const writeRootFiles = async serviceMap => {

  const writeFiles = async (path, globalFiles) => await writeFileMap({
    [`${path}/Dockerfile`]: globalFiles.dockerfile,
    [`${path}/requirements.txt`]: globalFiles.requirements,
    [`${path}/start_grpc_server.py`]: globalFiles.startServer,
    [`${path}/start_rest_server.py`]: globalFiles.startServer
  })

  await Promise.all(Object.keys(serviceMap.services).map(async service => {
    const { files: { global }, paths: { buildRoot } } = serviceMap.services[service]
    await writeFiles(buildRoot, global)
  }))

  return serviceMap

}

const writeServiceMetaJson = async (manifesto, serviceMap) => {

  const meta = service => ({
    currentService: service.active,
    servers: {
      rest: `${service.paths.rootDirName}/services/${service.active}/rest_server.py`,
      grpc: `${service.paths.rootDirName}/services/${service.active}/grpc_server.py`
    }
  })

  await Promise.all(Object.keys(serviceMap.services).map(async service => {
    const { paths: { buildRoot } } = serviceMap.services[service]
    await fse.writeFile(`${buildRoot}/manifest-meta.json`, JSON.stringify(meta(serviceMap.services[service])), 'utf8')
  }))

  return serviceMap

}

const writeRestFiles = async serviceMap => {

  const writeFiles = async (path, restFiles) => await writeFileMap({
    [`${path}/rest_server.py`]: restFiles.server
  })

  await Promise.all(Object.keys(serviceMap.services).map(async service => {
    const { files: { rest }, paths: { build: buildPath } } = serviceMap.services[service]
    const servicePath = `${buildPath}/services/${service}`
    await writeFiles(servicePath, rest)
  }))

  return serviceMap

}

const writeActiveGrpcFiles = async serviceMap => {

  const writeActiveFiles = async (path, grpcFiles, serviceName) => await writeFileMap({
    [`${path}/grpc_server.py`]: grpcFiles.server,
    [`${path}/service_meta.py`]: grpcFiles.serviceMeta,
    [`${path}/${serviceName}_pb2_grpc.py`]: grpcFiles.pb2Grpc,
    [`${path}/${serviceName}_pb2.py`]: grpcFiles.pb2,
    [`${path}/service.py`]: grpcFiles.service,
    // [`${path}/service.proto`]: grpcFiles.proto, // Already present from source copy as {{service}}.proto
    [`${path}/service-meta.json`]: grpcFiles.metaJson
  })

  await Promise.all(Object.keys(serviceMap.services).map(async service => {
    const { files: { grpc }, paths: { build: buildPath } } = serviceMap.services[service]
    const servicePath = `${buildPath}/services/${service}`
    await writeActiveFiles(servicePath, grpc, service)
  }))

  return serviceMap

}

const writeRelayGrpcFiles = async serviceMap => {

  const writeRelayFiles = async (path, grpcFiles, service) => await writeFileMap({
    [`${path}/${service}.py`]: grpcFiles.relay,
    [`${path}/service_meta.py`]: grpcFiles.serviceMeta,
    [`${path}/${service}_pb2_grpc.py`]: grpcFiles.pb2Grpc,
    [`${path}/${service}_pb2.py`]: grpcFiles.pb2,
    // [`${path}/service.proto`]: grpcFiles.proto,
    [`${path}/service-meta.json`]: grpcFiles.metaJson
  })

  const relayList = Object.keys(serviceMap.services).reduce((acc, service) => {
    const { relays, paths: { build: buildPath } } = serviceMap.services[service]
    const relayMaps = relays.map(r => {
      return {
        service,
        servicePath: buildPath,
        relay: r,
        relayGrpcFiles: serviceMap.services[r].files.grpc
      }
    })
    return [
      ...acc,
      ...relayMaps
    ]
  }, [])

  await Promise.all(relayList.map(async relayMap => {
    const { servicePath, relay, relayGrpcFiles } = relayMap
    // [
    //   { service, servicePath, relay, relayGrpcFiles }
    // ]
    const writePath = `${servicePath}/services/${relay}`
    await writeRelayFiles(writePath, relayGrpcFiles, relay)
  }))

  return serviceMap

}

const writeBuildDirectoriesForServices = async (serviceMap, manifesto) => {

  const { project: { root: sourceRootDir } } = manifesto
  const { build: { directory: buildDir } } = manifesto
  const rootDirName = sourceRootDir.split('/').slice(-1)[0]

  const serviceBuildRootPath = service => `${buildDir}/${service}/${rootDirName}`

  const pathMap = await Promise.all(Object.keys(serviceMap.services).map(async service => {
    const map = serviceMap.services[service]
    const paths = {
      build: serviceBuildRootPath(service),
      buildRoot: `${buildDir}/${service}`,
      source: sourceRootDir,
      rootDirName
    }
    await fse.ensureDir(paths.build)
    return {
      service,
      paths
    }
  }))

  return {
    ...serviceMap,
    services: Object.entries(serviceMap.services).reduce((acc, item) => {
      const [service, map] = item
      return {
        ...acc,
        [service]: {
          ...map,
          paths: pathMap.find(x => x.service === service).paths
        }
      }
    }, {})
  }

}

const copySourceFilesToBuildDirectory = async serviceMap => {

  const copySourceFiles = async (rootPath, buildPath) => {
    await fse.copy(rootPath, buildPath)
  }

  await Promise.all(Object.keys(serviceMap.services).map(async service => {
    const { paths: { source, build } } = serviceMap.services[service]
    await copySourceFiles(source, build)
  }))

  return serviceMap

}

const buildGrpcFiles = async serviceMap => {

  const buildFiles = async (serviceName, servicePyFile, serviceProtoFile) => {
    const grpcServer = await loadArtifact('grpc_server.py')
    const grpcRelay = await loadArtifact('grpc_relay.py')
    const serviceMeta = await loadArtifact('service_meta.py')
    const { pb2, pb2Grpc } = await createProtoBuffers(serviceProtoFile, serviceName)
    return {
      server: grpcServer,
      service: servicePyFile,
      relay: grpcRelay,
      serviceMeta: serviceMeta,
      pb2Grpc: pb2Grpc,
      pb2: pb2,
      proto: serviceProtoFile,
      metaJson: JSON.stringify({ serviceName })
    }
  }

  const grpcFileMap = await Promise.all(Object.keys(serviceMap.services).map(async service => {
    const map = serviceMap.services[service]
    return {
      service,
      files: await buildFiles(service, map.files.source.service, map.files.source.proto)
    }
  }))

  return {
    ...serviceMap,
    services: Object.entries(serviceMap.services).reduce((acc, item) => {
      const [service, map] = item
      return {
        ...acc,
        [service]: {
          ...map,
          files: {
            ...map.files,
            grpc: grpcFileMap.find(x => x.service === service).files
          }
        }
      }
    }, {})
  }

}

const buildRestFiles = async serviceMap => {

  const buildFiles = async () => {
    const restServer = await loadArtifact('rest_server.py')
    return {
      server: restServer
    }
  }

  const restFileMap = await Promise.all(Object.keys(serviceMap.services).map(async service => {
    const map = serviceMap.services[service]
    return {
      service,
      files: await buildFiles()
    }
  }))

  return {
    ...serviceMap,
    services: Object.entries(serviceMap.services).reduce((acc, item) => {
      const [service, map] = item
      return {
        ...acc,
        [service]: {
          ...map,
          files: {
            ...map.files,
            rest: restFileMap.find(x => x.service === service).files
          }
        }
      }
    }, {})
  }

}

const buildGlobalFiles = async serviceMap => {

  const buildFiles = async () => {
    return {
      requirements: await fse.readFile('./requirements.txt', 'utf8'),
      dockerfile: await loadArtifact('Dockerfile'),
      startServer: await loadArtifact('start_server.py')
    }
  }

  const globalFileMap = await Promise.all(Object.keys(serviceMap.services).map(async service => {
    const map = serviceMap.services[service]
    return {
      service,
      files: await buildFiles()
    }
  }))

  return {
    ...serviceMap,
    services: Object.entries(serviceMap.services).reduce((acc, item) => {
      const [service, map] = item
      return {
        ...acc,
        [service]: {
          ...map,
          files: {
            ...map.files,
            global: globalFileMap.find(x => x.service === service).files
          }
        }
      }
    }, {})
  }

}


const createProtoBuffers = async (proto, serviceName) => {
  const uuid = Math.random().toString(26).slice(2)
  const dir = `./.manifest/tmp/${uuid}`
  await fse.ensureDir(dir)
  await fse.writeFile(`${dir}/${serviceName}.proto`, '', 'utf8')
  await fse.writeFile(`${dir}/${serviceName}.proto`, proto, 'utf8')
  await protoc.generate(`./${serviceName}.proto`, dir)
  const pb2 = await fse.readFile(`${dir}/${serviceName}_pb2.py`, 'utf8')
  const pb2Grpc = await fse.readFile(`${dir}/${serviceName}_pb2_grpc.py`, 'utf8')
  await fse.remove('./.manifest/tmp')
  return {
    pb2,
    pb2Grpc: pb2Grpc.replace(/import ([a-z]+?)_pb2/gi, `from . import ${serviceName}_pb2`)
  }
}

const buildServiceMap = async (manifesto) => {

  const { project: { services: servicesDir, root: rootDir } } = manifesto

  const discoverServices = async (searchDir) => {
    return await core.fs.listDirectories(servicesDir)
  }

  const serviceNames = await discoverServices(servicesDir)

  const services = serviceNames.reduce((acc, service) => {
    return {
      ...acc,
      [service]: {
        active: service,
        relays: serviceNames.filter(s => s !== service)
      }
    }
  }, {})

  return {
    sourceProjectDir: rootDir,
    sourceServicesDir: servicesDir,
    services
  }

}

const loadSourceFiles = async (serviceMap) => {

  const { sourceProjectDir } = serviceMap

  const sourceMap = await Promise.all(Object.keys(serviceMap.services).map(async service => {
    return {
      service,
      source: {
        service: await fse.readFile(`${sourceProjectDir}/services/${service}/${service}.py`, 'utf8'),
        proto: await fse.readFile(`${sourceProjectDir}/services/${service}/${service}.proto`, 'utf8')
      }
    }
  }))

  return {
    ...serviceMap,
    services: Object.entries(serviceMap.services).reduce((acc, item) => {
      const [service, map] = item
      return {
        ...acc,
        [service]: {
          ...map,
          files: {
            source: sourceMap.find(x => x.service === service).source
          }
        }
      }
    }, {})
  }

}

const cleanWorkingDirectory = async manifesto => {
  const { build: { directory } } = manifesto
  await fse.remove(directory)
  await fse.ensureDir(directory)
}

export default build
