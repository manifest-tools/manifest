import * as fse from 'fs-extra'


const relPath = fileName => `${__dirname}/${fileName}`

export const restProto = async () => await fse.readFile(relPath('rest.proto'), 'utf8')
export const partialPackageJson = async () => await fse.readFile(relPath('partial-package.json'), 'utf8')

export const dockerfile = async () => await fse.readFile(relPath('docker/Dockerfile'), 'utf8')

export const grpcClient = async () => await fse.readFile(relPath('grpc/client.js'), 'utf8')
export const grpcServer = async () => await fse.readFile(relPath('grpc/server.js'), 'utf8')
export const grpcRelay = async () => await fse.readFile(relPath('grpc/relay.js'), 'utf8')
export const grpcIndex = async () => await fse.readFile(relPath('grpc/grpc-index.js'), 'utf8')

export const restServer = async () => await fse.readFile(relPath('rest/server.js'), 'utf8')
