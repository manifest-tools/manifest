import os
import json
import importlib
import sys


MANIFEST_META_FILE = 'manifest-meta.json'

def get_server_type():
    is_type = lambda t: t in os.path.basename(__file__)
    if is_type('rest'):
        return 'rest'
    if is_type('grpc'):
        return 'grpc'
    raise Exception('Unknown server type. Expected either "rest" or "grpc" to be in start script name.')

def get_meta():
    with open(MANIFEST_META_FILE, 'r') as file:
        return json.load(file)

def get_server_path(meta, server_type):
    return meta.get('servers').get(server_type)

def to_module_path(file_path):
    abs_path = file_path.replace('.py', '').replace('/', '.')
    # rel_path = f'.{module_path}'
    return abs_path

if __name__ == '__main__':
    server_type = get_server_type()
    server_path = get_server_path(get_meta(), server_type)
    module_path = to_module_path(server_path)

    server = importlib.import_module(module_path)

    server.serve()
