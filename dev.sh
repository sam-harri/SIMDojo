#!/usr/bin/env bash
set -euo pipefail

GO_PORT=8080
NEXT_PORT=3000

# Kill anything already on our ports
for port in $GO_PORT $NEXT_PORT; do
  pid=$(lsof -ti:$port 2>/dev/null || true)
  if [ -n "$pid" ]; then
    echo "Killing existing process on port $port (PID $pid)"
    kill $pid 2>/dev/null || true
    sleep 0.5
  fi
done

cleanup() {
  echo ""
  echo "Shutting down..."
  kill $GO_PID $NEXT_PID 2>/dev/null
  wait $GO_PID $NEXT_PID 2>/dev/null
  echo "Done."
}
trap cleanup EXIT

# Detect Apple Silicon and set cross-compile flags for AVX2
# Rosetta 2 handles x86_64 execution (including AVX2) transparently
if [[ "$(uname -s)" == "Darwin" && "$(uname -m)" == "arm64" ]]; then
  echo "Apple Silicon detected — cross-compiling to x86_64 (AVX2 via Rosetta 2)"
  export EXTRA_COMPILE_FLAGS="--target=x86_64-apple-darwin"
fi

# Start Go backend
cd server
export $(grep -v '^#' .env | xargs)
go run main.go &
GO_PID=$!
cd ..

# Start Next.js frontend
cd simdojo-app
npm run dev -- --port $NEXT_PORT &
NEXT_PID=$!
cd ..

echo "Go backend (PID $GO_PID) → http://localhost:$GO_PORT"
echo "Next.js    (PID $NEXT_PID) → http://localhost:$NEXT_PORT"
echo "Press Ctrl+C to stop both."

wait
