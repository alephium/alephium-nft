/* pages/_app.js */
import '../styles/globals.css'
import Link from 'next/link'
import { Web3Provider } from './alephium-providers'
import { WalletButton } from './wallet-button'

function MyApp({ Component, pageProps }) {
    return (
        <Web3Provider>
            <div>
                <nav className="border-b p-6">
                    <p className="text-4xl font-bold">Alpehium NFT Marketplace</p>
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
        </Web3Provider>
    )
}

export default MyApp