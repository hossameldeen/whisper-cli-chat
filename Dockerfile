# We need a docker image that has (1) nodejs, and (2) wnode (whisper node, from ethereum's go-client).
#
# We're using multi-stage build. Check here:
# https://docs.docker.com/develop/develop-images/multistage-build/#use-multi-stage-builds
#
# Luckily, `ethereum/go-client` uses multi-stage build as well, so check it out as an example.
#
# In the first stage, we're using `golang` as a base & not `ethereum/go-client` because the latter builds only `geth`
# binary while we need `wnode` binary as well.
# The first stage's code is derived from `ethereum/go-client`'s Dockerfile.


# First stage: Build Geth & Wnode in a stock Go builder container
FROM golang:1.10-alpine as geth-and-wnode-builder

# Added git for building the docker image locally
RUN apk add --no-cache make gcc musl-dev linux-headers git

RUN git clone --depth 1 https://github.com/ethereum/go-ethereum.git /go-ethereum

# TODO: I need only `make geth` & `make wnode`. However, there's no `make wnode`.
RUN cd /go-ethereum && make all


# Second stage: Copy wnode & geth from the first stage & deploy the app in a nodejs image
# using non-alpine version because seems like some packages need stuff like git & python
FROM node:8.11.2

# TODO: Installing ca-certificates because it was in `ethereum/go-client`. Don't know what it's for
RUN apt-get update && apt-get install -y \
    ca-certificates

COPY --from=geth-and-wnode-builder /go-ethereum/build/bin/geth /usr/local/bin/
COPY --from=geth-and-wnode-builder /go-ethereum/build/bin/wnode /usr/local/bin/

WORKDIR /usr/src/app

# TODO: How to make sure no-one is using `package-lock.json` instead of `yarn.lock`?
COPY package.json yarn.lock ./

# `yarn install` instead of `yarn instal --only=production` because I have only one image for dev/testing & production.
RUN yarn install

# Note: This uses .dockerignore
COPY . .

# TODO: Don't know which ports I'm really gonna use
EXPOSE 8545 8546 30303 30303/udp
CMD ["npm", "start"]