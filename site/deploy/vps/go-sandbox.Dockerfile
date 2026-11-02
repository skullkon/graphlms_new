FROM golang:1.26.4-bookworm
ENV GOCACHE=/gocache GOTOOLCHAIN=local GOPROXY=off GOMAXPROCS=2 CGO_ENABLED=1
# The warm cache stays read-only at runtime; only /tmp is writable.
RUN go build -race std && chown -R 65534:65534 /gocache
USER 65534:65534
WORKDIR /work
