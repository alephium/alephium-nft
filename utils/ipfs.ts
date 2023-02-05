import { create as ipfsHttpClient } from 'ipfs-http-client'

// @ts-ignore
const projectId = "2DI18ItoExD10wsXRxYdUlQZXKm"
const projectSecret = "9b0a02ede186fefb62ff046f8aa40bc2"
const auth = 'Basic ' + Buffer.from(projectId + ':' + projectSecret).toString('base64');

export const ipfsClient = ipfsHttpClient({
  host: 'ipfs.infura.io',
  port: 5001,
  protocol: 'https',
  headers: {
    authorization: auth,
  },
})
