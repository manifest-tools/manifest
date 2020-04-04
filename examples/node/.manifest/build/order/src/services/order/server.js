const grpc = require('grpc')
const protoLoader = require('@grpc/proto-loader')


/**
* Template all template variables here as constants
* DO NOT put template variables anywhere else -__-
*/
const PROTO_PATH = __dirname + '/service.proto'
const SERVICE_PATH = './service.js'
const SERVER_ADDRESS = '0.0.0.0:50051'

const findService = descriptor => {
  const properties = Object.keys(descriptor)
  const isService = name => {
    const re = /^([A-Za-z]+)Service/g
    return re.test(name)
  }
  return properties.find(isService)
}

const service = require(SERVICE_PATH)

// Later: a seperate package
const manifest_grpc = {

  isFunction: fn => typeof(fn) === 'function',

  /**
  * gRPC is stupid in that it has some polymorphic behavior when calling
  * gRPC service functions. If they are a streaming function then the callback
  * arg will be undefined and call() will return a readable stream. If the
  * gRPC service function is unary then a callback arg will be passed and
  * the result of call() will be a promise.
  * https://www.grpc.io/docs/tutorials/basic/node/#streaming-rpcs
  */
  isStreamingCall: (call, callback) => manifest_grpc.isFunction(callback),

  /**
  * Invert the call structure from gRPC's standard
  * to a more normalized function calling pattern
  */
  callAsyncWithArgs: asyncFn => (call, callback) => {
    // TODO: Check if its a streaming call and handle accordingly
    const isStreaming = manifest_grpc.isStreamingCall(call, callback)
    asyncFn(call.request).then(result => callback(null, result))
  },

  createGrpcServiceFunctionMap: service => {
    const methods = Object.keys(service)
    return methods.reduce((acc, method) => ({
      ...acc,
      [method]: manifest_grpc.callAsyncWithArgs(service[method])
    }), {})
  }

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

const server = new grpc.Server()

server.addService(Service.service, manifest_grpc.createGrpcServiceFunctionMap(service))
server.bind(SERVER_ADDRESS, grpc.ServerCredentials.createInsecure())

const start = () => {
  console.log(`${serviceName} (gRPC server) running @ ${SERVER_ADDRESS}`)
  server.start()
}

module.exports = {
  start
}
