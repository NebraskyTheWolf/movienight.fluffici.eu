GIT_SHA_FETCH := $(shell git rev-parse HEAD)
export GIT_SHA=$(GIT_SHA_FETCH)

.PHONY: all build_docker

all: build_docker build_rtmp

build_docker:
	docker build . -t ghcr.io/fluffici/movienight-beta:latest
	docker push ghcr.io/fluffici/movienight-beta:latest

build_rtmp:
	docker build . -t ghcr.io/fluffici/movienight-rtmp-beta:latest -f Dockerfile.rtmp
	docker push ghcr.io/fluffici/movienight-rtmp-beta:latest
