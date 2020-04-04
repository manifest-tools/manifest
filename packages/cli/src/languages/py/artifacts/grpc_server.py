from concurrent import futures
from functools import wraps

import grpc

import service_pb2
import service_pb2_grpc
from .service_meta import SERVICE_FN_META_MAP, SERVICE_NAME
import .service


def handle_grpc_model(fn):

    @wraps(fn)
    def wrapper(request, context):
        fn_meta = SERVICE_FN_META_MAP[fn.__name__]
        return_type_name = fn_meta.get('returns')
        ReturnTypeClass = getattr(books_pb2, return_type_name)

        # Get all fields from request model and take the
        # values (t[1]) from the tuples
        args = list(map(lambda t: t[1], request.ListFields()))

        result = fn(*args)

        return ReturnTypeClass(**result)

    return wrapper


def serve():
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))

    def unary_for(fn):
        fn_input = SERVICE_FN_META_MAP[fn]['input']
        fn_return = SERVICE_FN_META_MAP[fn]['returns']
        return grpc.unary_unary_rpc_method_handler(
            handle_grpc_model(getattr(service, fn)),
            request_deserializer=getattr(service_pb2, fn_input).FromString,
            response_serializer=getattr(service_pb2, fn_return).SerializeToString)

    rpc_method_handlers = { fn: unary_for(fn) for fn in SERVICE_FN_META_MAP.keys() }
    generic_handler = grpc.method_handlers_generic_handler(SERVICE_NAME, rpc_method_handlers)
    server.add_generic_rpc_handlers((generic_handler,))
    server.add_insecure_port('[::]:50051')
    server.start()
    server.wait_for_termination()

if __name__ == '__main__':
    serve()
