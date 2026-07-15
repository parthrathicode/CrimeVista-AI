#!/usr/bin/env sh
set -eu

APP_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$APP_DIR"

PORT="${X_ZOHO_CATALYST_LISTEN_PORT:-${PORT:-9000}}"
export PYTHONPATH="$APP_DIR/lib:$APP_DIR:${PYTHONPATH:-}"

echo "CrimeVista API startup"
echo "cwd=$(pwd)"
echo "port=$PORT"
echo "python=$(python3 --version 2>&1)"
echo "lib_present=$([ -d "$APP_DIR/lib" ] && echo yes || echo no)"
echo "db_present=$([ -f "$APP_DIR/crime_vista.db" ] && echo yes || echo no)"

exec python3 -m uvicorn main:app --host 0.0.0.0 --port "$PORT"
