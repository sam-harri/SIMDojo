#!/usr/bin/env bash
set -euo pipefail

GO_PORT=8080
NEXT_PORT=3000

for port in $GO_PORT $NEXT_PORT; do
  pid=$(lsof -ti:$port 2>/dev/null || true)
  if [ -n "$pid" ]; then
    echo "Killing existing process on port $port (PID $pid)"
    kill $pid 2>/dev/null || true
    sleep 0.5
  fi
done

cleanup() {
  echo "Shutting down..."
  kill $GO_PID $NEXT_PID 2>/dev/null
  wait $GO_PID $NEXT_PID 2>/dev/null
  echo "Done."
}
trap cleanup EXIT

cd server
export $(grep -v '^#' .env | xargs)
go run main.go &
GO_PID=$!
cd ..

cd simdojo-app
npm run dev -- --port $NEXT_PORT &
NEXT_PID=$!
cd ..

echo "Go backend (PID $GO_PID) → http://localhost:$GO_PORT"
echo "Next.js    (PID $NEXT_PID) → http://localhost:$NEXT_PORT"
echo "Press Ctrl+C to stop both."

wait
