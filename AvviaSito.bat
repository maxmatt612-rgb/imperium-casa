@echo off
cd /d "%~dp0"
echo Avvio del server locale di Imperium Casa...
start "Imperium Casa - Server (non chiudere finche' usi il sito)" cmd /k python -m http.server 8934
timeout /t 2 /nobreak >nul
start "" http://localhost:8934/index.html
