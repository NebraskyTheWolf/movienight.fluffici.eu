GIT_SHA_FETCH := $(shell git rev-parse HEAD)
export GIT_SHA=$(GIT_SHA_FETCH)

.PHONY: all build_docker

all: build_docker build_rtmp

build_docker:
	docker buildx build --builder cloud-farfys-owo . -t ghcr.io/fluffici/movienight-beta:latest
	docker push ghcr.io/fluffici/movienight-beta:latest

build_rtmp:
	docker buildx build --builder cloud-farfys-owo . -t ghcr.io/fluffici/movienight-rtmp-beta:latest -f Dockerfile.rtmp
	docker push ghcr.io/fluffici/movienight-rtmp-beta:latest
