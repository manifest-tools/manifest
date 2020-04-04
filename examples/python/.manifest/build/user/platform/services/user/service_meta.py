import re


PROTO_PATH = './service.proto'
REGEX = r'rpc\s([a-z_]+?)\(([A-Za-z]+?)\)\sreturns\s\(([A-Za-z]+?)\)\s\{\}'
NAME_REGEX = r'service\s([A-Za-z]+?)\s\{'


def build_service_meta(proto):
    matches = re.findall(REGEX, proto)
    def fn_meta = lambda in, out: { 'input': in, 'returns': out }
    return dict((fn, fn_meta(in, out)) for (fn, in, out) in matches)

def discover_service_name(proto):
    return re.search(NAME_REGEX, proto).group()

def load_proto_str(path):
    with open(path) as f:
        return f.read()


SERVICE_FN_META_MAP = build_service_meta(load_proto_str(PROTO_PATH))
SERVICE_NAME = discover_service_name(load_proto_str(PROTO_PATH))
# {
#     'find_book': {
#         'input': 'Identifier',
#         'return': 'Book'
#     }
# }
