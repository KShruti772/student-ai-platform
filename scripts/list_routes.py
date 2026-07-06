import sys, os
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
BACKEND_PATH = os.path.join(ROOT, 'backend')
if BACKEND_PATH not in sys.path:
    sys.path.insert(0, BACKEND_PATH)
from importlib import import_module
app = import_module('app').app

for r in app.router.routes:
    name = getattr(r, 'name', type(r).__name__)
    path = getattr(r, 'path', None)
    methods = getattr(r, 'methods', None)
    print(type(r).__name__, '|', name, '|', path, '|', methods)
