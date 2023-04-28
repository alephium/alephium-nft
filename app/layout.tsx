'use client'
import { FetchConfig } from 'http-react'
import { AlephiumConnectProvider } from '@alephium/web3-react'
import './global.css'
import { NETWORK } from '../configs/nft'
import Link from 'next/link'
import { AlephiumConnectButton } from '@alephium/web3-react'

function MainLayout({ children }) {
  return (
    <AlephiumConnectProvider useTheme="retro" addressGroup={0} network={NETWORK}>
      <FetchConfig baseUrl='/api'>
        <html data-theme='light'>
          <head>
            <title>Alephium NFT Marketplace</title>
            <meta name='description' content='Alephium NFT Marketplace' />
          </head>
          <body>
            <div>
              <nav className="border-b p-6">
                <p className="text-4xl font-bold">Alephium NFT Marketplace</p>
                <div className="flex mt-4">
                  <Link href="/my-nfts" legacyBehavior>
                    <a className="mr-4 text-pink-500">
                      My NFTs
                    </a>
                  </Link>
                  <Link href="/create-collections" legacyBehavior>
                    <a className="mr-6 text-pink-500">
                      Create Collections
                    </a>
                  </Link>
                  <Link href="/buy-nfts" legacyBehavior>
                    <a className="mr-6 text-pink-500">
                      Buy NFTs
                    </a>
                  </Link>
                  <AlephiumConnectButton />
                  <div className="flex mt-4">
                    {children}
                  </div>
                </div>
              </nav>
            </div>
          </body>
        </html>
      </FetchConfig>
    </AlephiumConnectProvider>
  )
}

export default MainLayout
