#!/usr/bin/env python3
"""Local-only standalone launcher. No dependencies beyond Python 3.
Serves with HTTP Range support so videos play in Chrome."""
from pathlib import Path
import sys
import webbrowser

root = Path(__file__).resolve().parent
sys.path.insert(0, str(root / 'scripts'))
from range_server import serve

server = serve(root, host='127.0.0.1', port=8767)
url = 'http://127.0.0.1:%d/' % server.server_port
print('iCAR Claw超级APP3.0：' + url, flush=True)
print('保持此窗口打开。按 Control+C 停止服务。', flush=True)
webbrowser.open(url)
try:
    server.serve_forever()
except KeyboardInterrupt:
    pass
finally:
    server.server_close()
