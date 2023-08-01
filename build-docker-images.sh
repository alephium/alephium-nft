#!/usr/bin/env bash

NETWORKS=('mainnet' 'testnet' 'devnet')

network=$1

if [ -z "${network// }" ]
then
    echo "Please specify the network type"
    exit 1
fi

set -euo pipefail xtrace

VERSION=0.4.31

export DOCKER_BUILDKIT=1

if [[ ${NETWORKS[*]}] =~ $network ]]
then
    echo "Build images on $network"
else
    echo "Network has to be one of ${NETWORKS[*]}"
    exit 1
fi

docker build -f ./docker/Dockerfile.frontend . -t alephium-nft-frontend:$VERSION --build-arg NEXT_PUBLIC_NETWORK=$network
docker build -f ./docker/Dockerfile.backend . -t alephium-nft-backend:$VERSION --build-arg NEXT_PUBLIC_NETWORK=$network