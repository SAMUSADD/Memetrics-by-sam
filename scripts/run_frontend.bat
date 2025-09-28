@echo off
cd /d %~dp0\..\frontend
py -3 -m http.server 5173
