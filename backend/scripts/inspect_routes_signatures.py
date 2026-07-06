import sys
sys.path.insert(0, r'D:\student-ai-platform\\backend')
import app
from inspect import signature, iscoroutinefunction

print('Inspecting routes for app...')
for r in app.app.router.routes:
    kind = type(r).__name__
    path = getattr(r, 'path', None)
    ep = getattr(r, 'endpoint', None)
    name = getattr(ep, '__name__', None)
    try:
        sig = signature(ep)
    except Exception as e:
        sig = f'<signature error: {e}>'
    print(kind, path, name, sig)
    if kind == 'WebSocketRoute':
        print('  is coroutine:', iscoroutinefunction(ep))
