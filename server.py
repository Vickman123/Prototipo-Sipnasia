#!/usr/bin/env python3
"""
SIPNASIA XR - Servidor de Desarrollo Local
Configurado para WebXR, Three.js (ES Modules) y pruebas de red local.
"""

import http.server
import socketserver
import socket
import os
import sys

PORT = 8080
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class SipnasiaHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        # Cabeceras para WebXR, ES Modules y desarrollo web
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        super().end_headers()

    def guess_type(self, path):
        # Asegurar tipos MIME correctos para Three.js y WebXR
        if path.endswith('.js') or path.endswith('.mjs'):
            return 'application/javascript; charset=utf-8'
        elif path.endswith('.json'):
            return 'application/json; charset=utf-8'
        elif path.endswith('.css'):
            return 'text/css; charset=utf-8'
        elif path.endswith('.html'):
            return 'text/html; charset=utf-8'
        elif path.endswith('.wasm'):
            return 'application/wasm'
        return super().guess_type(path)

def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(('8.8.8.8', 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return '127.0.0.1'

def run():
    socketserver.TCPServer.allow_reuse_address = True
    local_ip = get_local_ip()
    
    try:
        with socketserver.TCPServer(("", PORT), SipnasiaHTTPRequestHandler) as httpd:
            print("=" * 60)
            print("🌐 SIPNASIA XR // Servidor Local Activo")
            print("=" * 60)
            print(f"👉 Local:        http://localhost:{PORT}")
            print(f"👉 Red Local:    http://{local_ip}:{PORT}")
            print(f"👉 Meta Quest:   Abre en el navegador del visor: http://{local_ip}:{PORT}")
            print("=" * 60)
            print("Presiona Ctrl+C para detener el servidor.\n")
            sys.stdout.flush()
            httpd.serve_forever()
    except OSError as e:
        if e.errno == 48: # Address already in use
            alt_port = 8081
            print(f"⚠️ Puerto {PORT} en uso, intentando puerto alternativo {alt_port}...")
            with socketserver.TCPServer(("", alt_port), SipnasiaHTTPRequestHandler) as httpd:
                print(f"👉 Local:     http://localhost:{alt_port}")
                print(f"👉 Red Local: http://{local_ip}:{alt_port}")
                sys.stdout.flush()
                httpd.serve_forever()
        else:
            raise e

if __name__ == '__main__':
    run()
