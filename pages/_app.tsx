/* pages/_app.js */
import '../styles/globals.css'
import Link from 'next/link'
import AlephiumWeb3Provider from './alephium-web3-providers'
import WalletButton from './wallet-button'
import { AppProps } from 'next/app'

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <AlephiumWeb3Provider>
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
            <Link href="/mint-nfts">
              <a className="mr-6 text-pink-500">
                Mint NFTs
              </a>
            </Link>
            <Link href="/buy-nfts">
              <a className="mr-6 text-pink-500">
                Buy NFTs
              </a>
            </Link>
            <WalletButton />
          </div>
        </nav>
        <Component {...pageProps} />
      </div>
    </AlephiumWeb3Provider>
  )
}

export default MyApp