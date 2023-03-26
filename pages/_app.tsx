/* pages/_app.js */
import '../styles/globals.css'
import Link from 'next/link'
import { AppProps } from 'next/app'
import { AlephiumConnectButton, AlephiumConnectProvider } from '@alephium/web3-react'

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <AlephiumConnectProvider useTheme="retro" addressGroup={0}>
      <title>Alephium NFT Marketplace</title>
      <div>
        <nav className="border-b p-6">
          <p className="text-4xl font-bold">Alephium NFT Marketplace</p>
          <div className="flex mt-4">
            <Link href="/my-nfts">
              <a className="mr-4 text-pink-500">
                My NFTs
              </a>
            </Link>
            <Link href="/create-collections">
              <a className="mr-6 text-pink-500">
                Create Collections
              </a>
            </Link>
            <Link href="/buy-nfts">
              <a className="mr-6 text-pink-500">
                Buy NFTs
              </a>
            </Link>
            <AlephiumConnectButton />
          </div>
        </nav>
        <Component {...pageProps} />
      </div>
    </AlephiumConnectProvider>
  )
}

export default MyApp