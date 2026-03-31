# build nsail from source
FROM alpine:3.22 AS nsjail-builder

RUN apk add --no-cache \
    build-base \
    bison \
    flex \
    git \
    libcap-dev \
    libnl3-dev \
    linux-headers \
    protobuf-dev \
    musl-dev \
    libc-dev \
    bsd-compat-headers

ARG NSJAIL_VERSION=3.4
RUN git clone --branch ${NSJAIL_VERSION} --depth 1 \
    https://github.com/google/nsjail.git /nsjail && \
    cd /nsjail && make -j$(nproc)

FROM golang:1.26-alpine3.22 AS go-builder

WORKDIR /build

# dependencies first for layer caching
COPY server/go.mod server/go.sum ./
RUN go mod download

COPY server/ .

RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
    go build -trimpath -ldflags="-s -w" -o /app/server .

FROM alpine:3.22

RUN apk add --no-cache \
    clang \
    g++ \
    musl-dev \
    libcap \
    libnl3 \
    protobuf \
    ca-certificates \
    tzdata

COPY --from=nsjail-builder /nsjail/nsjail /usr/local/bin/nsjail
COPY --from=go-builder /app/server /app/server
COPY server/problems/ /app/problems/

WORKDIR /app

EXPOSE 8008

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD wget -qO- http://localhost:${PORT:-8008}/api/health || exit 1

ENTRYPOINT ["/app/server"]