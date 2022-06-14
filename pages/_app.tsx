/* pages/_app.js */
import '../styles/globals.css'
import Link from 'next/link'
import { walletConnectCallback } from '../utils/providers'

function MyApp({ Component, pageProps }) {
    return (
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
                    <button className="mt-4 bg-blue-500 text-white font-bold py-2 px-12 rounded" onClick={walletConnectCallback}>Connect to Wallet</button>
                </div>
            </nav>
            <Component {...pageProps} />
        </div>
    )
}

export default MyApp