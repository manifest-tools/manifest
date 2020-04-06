import re, os
import json


META_JSON_FILE = 'service-meta.json'
REGEX = r'rpc\s([a-z_]+?)\(([A-Za-z]+?)\)\sreturns\s\(([A-Za-z]+?)\)\s\{\}'


def load_service_meta(path):
    with open(path) as f:
        return json.load(f)

def build_path(file_name):
    return os.path.join(os.path.dirname(__file__), file_name)

def build_service_meta(proto):
    matches = re.findall(REGEX, proto)
    fn_meta = lambda input, ret: { 'input': input, 'returns': ret }
    return dict((fn, fn_meta(inp, ret)) for (fn, inp, ret) in matches)

def parse_service_class(proto):
    NAME_REGEX = r'service\s([A-Za-z]+?)\s\{'
    return re.search(NAME_REGEX, proto).groups()[0]

def load_proto_str(path):
    with open(path) as f:
        return f.read()

meta_json_path = build_path(META_JSON_FILE)
service_name = load_service_meta(meta_json_path).get('serviceName')
proto_str = load_proto_str(build_path(f'{service_name}.proto'))

SERVICE_FN_META_MAP = build_service_meta(proto_str)
SERVICE_CLASS = parse_service_class(proto_str)
SERVICE_NAME = service_name
# {
#     'find_book': {
#         'input': 'Identifier',
#         'return': 'Book'
#     }
# }
