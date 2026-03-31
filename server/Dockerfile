# build nsjail from source (using official Debian approach)
FROM debian:bookworm-slim AS nsjail-builder

RUN apt-get -y update && apt-get install -y \
    autoconf \
    bison \
    flex \
    gcc \
    g++ \
    git \
    libprotobuf-dev \
    libnl-route-3-dev \
    libtool \
    make \
    pkg-config \
    protobuf-compiler

ARG NSJAIL_VERSION=3.4
RUN git clone --branch ${NSJAIL_VERSION} --depth 1 \
    https://github.com/google/nsjail.git /nsjail && \
    cd /nsjail && make -j$(nproc)

# build go binary
FROM golang:1.26-bookworm AS go-builder

WORKDIR /build

COPY server/go.mod server/go.sum ./
RUN go mod download

COPY server/ .

RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
    go build -trimpath -ldflags="-s -w" -o /app/server .

# final image
FROM debian:bookworm-slim

RUN apt-get -y update && apt-get install -y \
    libc6 \
    libstdc++6 \
    libprotobuf32 \
    libnl-route-3-200 \
    clang \
    g++ \
    ca-certificates \
    tzdata \
    && rm -rf /var/lib/apt/lists/*

COPY --from=nsjail-builder /nsjail/nsjail /usr/local/bin/nsjail
COPY --from=go-builder /app/server /app/server
COPY server/problems/ /app/problems/

WORKDIR /app

EXPOSE 8008

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD wget -qO- http://localhost:8008/api/health || exit 1

ENTRYPOINT ["/app/server"]