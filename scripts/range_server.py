#!/usr/bin/env python3
"""Static file handler with HTTP Range (206 Partial Content) support.

Chrome/Safari require Range responses to play <video> mp4 sources;
python's stock SimpleHTTPRequestHandler ignores the Range header,
which makes videos fail to load. Import RangeHTTPRequestHandler or
call serve() from launcher scripts.
"""
import os
import re
import sys
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler

_RANGE_RE = re.compile(r'bytes=(\d*)-(\d*)$')


class RangeHTTPRequestHandler(SimpleHTTPRequestHandler):
    _range_remaining = None

    def send_head(self):
        range_header = self.headers.get('Range')
        if not range_header:
            return super().send_head()
        path = self.translate_path(self.path)
        if os.path.isdir(path):
            return super().send_head()
        try:
            fsize = os.path.getsize(path)
        except OSError:
            self.send_error(404, 'File not found')
            return None
        m = _RANGE_RE.match(range_header.strip())
        if not m:
            self.send_error(416, 'Requested Range Not Satisfiable')
            return None
        start_s, end_s = m.groups()
        if start_s:
            start = int(start_s)
            end = int(end_s) if end_s else fsize - 1
        elif end_s:  # suffix range: bytes=-N
            start = max(0, fsize - int(end_s))
            end = fsize - 1
        else:
            self.send_error(416, 'Requested Range Not Satisfiable')
            return None
        if start >= fsize or start > end:
            self.send_response(416)
            self.send_header('Content-Range', 'bytes */%d' % fsize)
            self.end_headers()
            return None
        end = min(end, fsize - 1)
        try:
            f = open(path, 'rb')
        except OSError:
            self.send_error(404, 'File not found')
            return None
        self.send_response(206)
        self.send_header('Content-Type', self.guess_type(path))
        self.send_header('Content-Range', 'bytes %d-%d/%d' % (start, end, fsize))
        self.send_header('Accept-Ranges', 'bytes')
        self.send_header('Content-Length', str(end - start + 1))
        self.end_headers()
        f.seek(start)
        self._range_remaining = end - start + 1
        return f

    def copyfile(self, source, outputfile):
        remaining = self._range_remaining
        if remaining is None:
            return super().copyfile(source, outputfile)
        self._range_remaining = None
        bufsize = 64 * 1024
        while remaining > 0:
            chunk = source.read(min(bufsize, remaining))
            if not chunk:
                break
            try:
                outputfile.write(chunk)
            except (BrokenPipeError, ConnectionResetError):
                break
            remaining -= len(chunk)


def serve(root, host='127.0.0.1', port=7100):
    from functools import partial
    handler = partial(RangeHTTPRequestHandler, directory=str(root))
    try:
        server = ThreadingHTTPServer((host, port), handler)
    except OSError:
        server = ThreadingHTTPServer((host, 0), handler)
    return server


if __name__ == '__main__':
    from pathlib import Path
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 7100
    root = Path(__file__).resolve().parent.parent
    server = serve(root, port=port)
    print('range server: http://127.0.0.1:%d/' % server.server_port, flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
