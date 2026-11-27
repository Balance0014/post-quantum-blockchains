"""Serve the built website the way GitHub Pages does, for Lighthouse in CI and for local previews.

GitHub Pages compresses HTML, CSS, JavaScript, JSON, SVG and text with gzip and lets browsers cache files for ten
minutes. Python's plain http.server does neither, so an audit against it measures every file at full size and scores
the page slower than visitors see it. This server adds both and is otherwise the standard library's file server.

Usage: python3 scripts/serve_site.py <directory> [port]
"""
import gzip
import os
import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

COMPRESS = ('text/', 'application/javascript', 'application/json', 'image/svg+xml', 'application/xml')


class Handler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'max-age=600')
        super().end_headers()

    def do_GET(self):
        path = self.translate_path(self.path)
        if os.path.isdir(path):
            if not self.path.split('?', 1)[0].endswith('/'):
                return super().do_GET()  # the standard redirect to the address with a trailing slash
            path = os.path.join(path, 'index.html')
        ctype = self.guess_type(path)
        if not os.path.isfile(path) or 'gzip' not in self.headers.get('Accept-Encoding', '') or not ctype.startswith(COMPRESS):
            return super().do_GET()
        with open(path, 'rb') as f:
            body = gzip.compress(f.read(), 6)
        self.send_response(200)
        self.send_header('Content-Type', ctype)
        self.send_header('Content-Encoding', 'gzip')
        self.send_header('Vary', 'Accept-Encoding')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, *args):
        pass


if __name__ == '__main__':
    root = sys.argv[1]
    port = int(sys.argv[2]) if len(sys.argv) > 2 else 8080
    ThreadingHTTPServer(('127.0.0.1', port), partial(Handler, directory=root)).serve_forever()
