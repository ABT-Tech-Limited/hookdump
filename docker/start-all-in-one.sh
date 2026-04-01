#!/bin/sh
set -eu

terminate() {
  if [ -n "${backend_pid:-}" ]; then
    kill -TERM "$backend_pid" 2>/dev/null || true
    wait "$backend_pid" 2>/dev/null || true
  fi

  if [ -n "${nginx_pid:-}" ]; then
    kill -TERM "$nginx_pid" 2>/dev/null || true
    wait "$nginx_pid" 2>/dev/null || true
  fi
}

trap 'terminate; exit 0' INT TERM

node /app/backend/dist/index.js &
backend_pid=$!

nginx -g 'daemon off;' &
nginx_pid=$!

while :; do
  if ! kill -0 "$backend_pid" 2>/dev/null; then
    if wait "$backend_pid"; then
      status=0
    else
      status=$?
    fi

    kill -TERM "$nginx_pid" 2>/dev/null || true
    wait "$nginx_pid" 2>/dev/null || true
    exit "$status"
  fi

  if ! kill -0 "$nginx_pid" 2>/dev/null; then
    if wait "$nginx_pid"; then
      status=0
    else
      status=$?
    fi

    kill -TERM "$backend_pid" 2>/dev/null || true
    wait "$backend_pid" 2>/dev/null || true
    exit "$status"
  fi

  sleep 1
done
