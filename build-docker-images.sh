#!/usr/bin/env bash

NETWORKS=('mainnet' 'testnet' 'devnet')

network=$1

if [ -z "${network// }" ]
then
    echo "Please specify the network type"
    exit 1
fi

set -euo pipefail xtrace

export DOCKER_BUILDKIT=1

if [[ ${NETWORKS[*]}] =~ $network ]]
then
    echo "Build images on $network"
else
    echo "Network has to be one of ${NETWORKS[*]}"
    exit 1
fi

pushd `pwd`/frontend && npm run build-docker-image -- --build-arg NEXT_PUBLIC_NETWORK=$network && popd
pushd `pwd`/backend && npm run build-docker-image -- --build-arg NEXT_PUBLIC_NETWORK=$network && popd
