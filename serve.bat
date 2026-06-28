@echo off
setlocal EnableDelayedExpansion

:: ── Find a free port starting at 8080 ──────────────────────────
set PORT=8080
:find_port
netstat -ano | findstr /R /C:"[:.]%PORT% " >nul 2>&1
if !errorlevel! == 0 (
    set /a PORT+=1
    goto find_port
)

:: ── Get local network IP ────────────────────────────────────────
for /f "tokens=2 delims=:" %%A in ('ipconfig ^| findstr /C:"IPv4"') do (
    set IP=%%A
    set IP=!IP: =!
    goto got_ip
)
:got_ip

:: ── Write the custom server script ─────────────────────────────
set PYFILE=%TEMP%\portfolio_server.py
(
echo import http.server, socketserver, os, sys, webbrowser, threading
echo.
echo PORT = %PORT%
echo.
echo class Handler^(http.server.SimpleHTTPRequestHandler^):
echo     extensions_map = {
echo         **http.server.SimpleHTTPRequestHandler.extensions_map,
echo         '.wsz':  'application/zip',
echo         '.zip':  'application/zip',
echo         '.mp3':  'audio/mpeg',
echo         '.ogg':  'audio/ogg',
echo         '.wav':  'audio/wav',
echo         '':      'application/octet-stream',
echo     }
echo     def log_message^(self, format, *args^):
echo         pass  # silence request logs
echo.
echo os.chdir^(r'%CD%'^)
echo.
echo local_url   = f'http://localhost:{PORT}'
echo network_url = f'http://%IP%:{PORT}'
echo.
echo print^(^)
echo print^('  Portfolio OS — Dev Server'^)
echo print^('  ─────────────────────────────────────'^)
echo print^(f'  Local  :  {local_url}'^)
echo print^(f'  Network:  {network_url}'^)
echo print^(^)
echo print^('  Press Ctrl+C to stop.'^)
echo print^(^)
echo.
echo threading.Timer^(0.5, lambda: webbrowser.open^(local_url^)^).start^(^)
echo.
echo with socketserver.TCPServer^(^('', PORT^), Handler^) as httpd:
echo     httpd.allow_reuse_address = True
echo     try:
echo         httpd.serve_forever^(^)
echo     except KeyboardInterrupt:
echo         print^('\n  Server stopped.'^)
) > "%PYFILE%"

:: ── Launch ──────────────────────────────────────────────────────
cls
echo.
echo   Starting Portfolio OS server...
echo.
python "%PYFILE%"
if !errorlevel! neq 0 (
    echo.
    echo   ERROR: Python not found. Install from https://python.org
    pause
)
