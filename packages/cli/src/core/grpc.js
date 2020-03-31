import { run } from './cmd'
import { findReplaceInFile } from './fs'



export const generate = async (serviceName, protoSourcePath) => {

  // https://github.com/protocolbuffers/protobuf/
  await run([
    'protoc',
    '-I=.',
    protoSourcePath,
    '--js_out=import_style=commonjs,binary:.',
    `--grpc_out=.`,
    '--plugin=protoc-gen-grpc=`which grpc_tools_node_protoc_plugin`'
  ].join(' '))


  const grpc_pb_path = protoSourcePath.replace('.proto', '_grpc_pb.js')

  await patchProtoPaths(grpc_pb_path, serviceName)

}

/**
* Hopefulle, this is temporary - until I can figure out how to bend
* the protoc cli tool to my wil :excellent: but until then we need
* to patch the stupid file path it sets to get to the file that is
* in the same directory -__-
*/
const patchProtoPaths = async (filePath, service) => {
  const pattern = `../../../.manifest/services/${service}/${service}`
  const replacement = `./${service}`
  await findReplaceInFile(filePath, pattern, replacement)
}
