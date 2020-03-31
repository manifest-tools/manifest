const grpc = require('grpc')
const protoLoader = require('@grpc/proto-loader')

const MANIFEST_CONFIG = JSON.parse(JSON.parse(process.env.MANIFEST_CONFIG))
const PROTO_PATH = __dirname + '/service.proto'

const findService = descriptor => {
  const properties = Object.keys(descriptor)
  const isService = name => {
    const re = /^([A-Za-z]+)Service/g
    return re.test(name)
  }
  return properties.find(isService)
}

// Suggested options for similarity to existing grpc.load behavior
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
})

const protoDescriptor = grpc.loadPackageDefinition(packageDefinition)

const serviceName = findService(protoDescriptor)

const Service = protoDescriptor[serviceName]
const serverInfo = MANIFEST_CONFIG.serviceMap[serviceName]
const serverAddress = `${serverInfo.hostname}:${serverInfo.port}`

exports.create = () => {
  console.log(`creating new client for ${serverAddress}`)
  return new Service(serverAddress, grpc.credentials.createInsecure())
}
