#!/usr/bin/env python3
"""Static dev server for Kimi Work preview. Forwards --host/--port CLI args.
Supports HTTP Range requests so <video> sources play in Chrome."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from range_server import serve

host, port = '127.0.0.1', 7100
args = sys.argv[1:]
for i, a in enumerate(args):
    if a == '--host' and i + 1 < len(args):
        host = args[i + 1]
    elif a == '--port' and i + 1 < len(args):
        port = int(args[i + 1])
    elif a.startswith('--port='):
        port = int(a.split('=', 1)[1])
    elif a.startswith('--host='):
        host = a.split('=', 1)[1]

root = Path(__file__).resolve().parent.parent
server = serve(root, host=host, port=port)
print(f'iCAR超级APP-KIMI preview: http://{host}:{server.server_port}/', flush=True)
try:
    server.serve_forever()
except KeyboardInterrupt:
    pass
finally:
    server.server_close()
