import grpc

import service_pb2
import service_pb2_grpc
from .service_meta import SERVICE_FN_META_MAP


channel = grpc.insecure_channel('localhost:50051')
stub = books_pb2_grpc.BookServiceStub(channel)


def proto_to_dict(proto_class_instance):
    return dict((f[0].name, f[1]) for f in proto_class_instance.ListFields())

def relay_to(name):
    fn = getattr(stub, name)
    fn_meta = SERVICE_FN_META_MAP.get(name)

    fn_return_class = fn_meta.get('return')
    fn_input_class = fn_meta.get('input')

    InputClass = getattr(books_pb2, fn_input_class)

    def caller(*args, **kwargs):
        result = fn(InputClass(*args, **kwargs))
        return proto_to_dict(result)

    return caller

for fn in SERVICE_FN_META_MAP.keys():
    vars()[fn] = relay_to(fn)
