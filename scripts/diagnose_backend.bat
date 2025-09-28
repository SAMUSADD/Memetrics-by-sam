@echo off
setlocal
cd /d %~dp0\..\backend
echo === Python launcher info ===
where py
py -0p
echo === Creating venv (if missing) ===
if not exist .venv ( py -3 -m venv .venv )
call .venv\Scripts\activate
echo === Python version ===
python -V
echo === Pip version ===
pip -V
echo === Installing reqs ===
pip install -r requirements.txt
echo === Import check ===
python - <<PY
import sys, os
print("cwd:", os.getcwd())
print("sys.path[0]:", sys.path[0])
import app
print("Imported app OK")
PY
echo === Uvicorn dry run (import only) ===
python - <<PY
import uvicorn
uvicorn.importer.import_from_string("app:app")
print("Uvicorn importer OK")
PY
echo Done. If this succeeded, run scripts\run_backend.bat
