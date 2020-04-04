import { run } from '~manifest/core/cmd'



const generate = async (protoSourcePath, startDir) => {

  // https://github.com/protocolbuffers/protobuf/
  //
  // python -m grpc_tools.protoc -I. --python_out=. --grpc_python_out=. ./libra/books/books.proto
  //
  await run([
    'python3',
    '-m',
    'grpc_tools.protoc',
    '-I.',
    '--python_out=.',
    '--grpc_python_out=.',
    protoSourcePath
  ].join(' '), startDir)

}

export default {
  generate
}
