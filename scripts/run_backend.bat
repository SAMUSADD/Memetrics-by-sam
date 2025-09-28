@echo off
setlocal
cd /d %~dp0\..
if not exist backend\.venv ( py -3 -m venv backend\.venv )
call backend\.venv\Scripts\activate
python -m pip install -U pip
pip install -r backend\requirements.txt
uvicorn backend.app:app --reload --port 8000
