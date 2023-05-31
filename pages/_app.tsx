/* pages/_app.js */
import { AppProps } from 'next/app'
import { AlephiumConnectButton, AlephiumConnectProvider } from '@alephium/web3-react'
import { NETWORK } from '../configs/nft'
import { ThemeProvider } from 'next-themes';
import Head from 'next/head';
import { Navbar } from '../components';
import Script from 'next/script';
import '../styles/globals.css'

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider attribute="class">
      <AlephiumConnectProvider useTheme="retro" addressGroup={0} network={NETWORK}>
        <div className="dark:bg-nft-dark bg-white min-h-screen">
          <Head>
            <title>Alelphium</title>
            <meta name="viewport" content="initial-scale=1.0, width=device-width" />
          </Head>
          <Navbar />
          <div className="pt-65">
            <Component {...pageProps} />
          </div>
        </div>

        <Script src="https://kit.fontawesome.com/77a74156e4.js" crossOrigin="anonymous" />
      </AlephiumConnectProvider>
    </ThemeProvider>
  )
}

export default MyApp