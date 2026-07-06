from importlib import import_module
import sys, os, json

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
BACKEND_PATH = os.path.join(ROOT, 'backend')
if BACKEND_PATH not in sys.path:
    sys.path.insert(0, BACKEND_PATH)

app = import_module('app').app
out = []
for r in app.router.routes:
    try:
        methods = list(getattr(r, 'methods', [])) if getattr(r, 'methods', None) else []
        out.append({'name': getattr(r, 'name', type(r).__name__), 'path': getattr(r, 'path', None), 'methods': methods, 'route_type': type(r).__name__})
    except Exception as e:
        out.append({'error': str(e)})

print(json.dumps(out, indent=2))
