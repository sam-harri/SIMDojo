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
    protobuf-dev

ARG NSJAIL_VERSION=3.4
RUN git clone --branch ${NSJAIL_VERSION} --depth 1 \
    https://github.com/google/nsjail.git /nsjail && \
    cd /nsjail && make -j$(nproc)

FROM golang:1.26-alpine3.22 AS go-builder

WORKDIR /build

# dependencies first for layer caching
COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
    go build -trimpath -ldflags="-s -w" -o /app/server .

FROM alpine:3.22

# clang/g++/musl-dev: C++17 compilation of user submissions and harnesses
# libcap/libnl3/protobuf: nsjail runtime shared library dependencies
# ca-certificates: outbound TLS (Clerk JWKS fetch)
# tzdata: timezone support
RUN apk add --no-cache \
    clang \
    g++ \
    musl-dev \
    libcap \
    libnl3 \
    protobuf \
    ca-certificates \
    tzdata

# nsjail requires CAP_SYS_ADMIN / CAP_NET_ADMIN to create namespaces.
# Run the container with --privileged or --cap-add SYS_ADMIN --cap-add NET_ADMIN.
COPY --from=nsjail-builder /nsjail/nsjail /usr/local/bin/nsjail
COPY --from=go-builder /app/server /app/server
COPY problems/ /app/problems/

WORKDIR /app

EXPOSE 8008

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD wget -qO- http://localhost:${PORT:-8008}/api/health || exit 1

ENTRYPOINT ["/app/server"]
