#!/usr/bin/env bash
set -euo pipefail

GO_PORT=8008
NEXT_PORT=3000
CONTAINER_NAME=simdojo-server

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
  docker stop $CONTAINER_NAME 2>/dev/null || true
  kill $NEXT_PID 2>/dev/null || true
  wait $NEXT_PID 2>/dev/null || true
  echo "Done."
}
trap cleanup EXIT

echo "Building Docker image..."
docker build -t $CONTAINER_NAME ./server

docker run --rm \
  --name $CONTAINER_NAME \
  --privileged \
  --env-file server/.env \
  -p $GO_PORT:$GO_PORT \
  $CONTAINER_NAME &

cd simdojo-app
npm run dev -- --port $NEXT_PORT &
NEXT_PID=$!
cd ..

echo "Go backend (Docker) → http://localhost:$GO_PORT"
echo "Next.js    (PID $NEXT_PID) → http://localhost:$NEXT_PORT"
echo "Press Ctrl+C to stop both."

wait
