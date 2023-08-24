/* pages/_app.js */
import { AppProps } from 'next/app'
import { AlephiumWalletProvider } from '@alephium/web3-react'
import { getAlephiumNFTConfig } from '../../shared/configs'
import { ThemeProvider } from 'next-themes';
import Head from 'next/head';
import { Navbar } from '../components';
import Script from 'next/script';
import '../styles/globals.css'
import { SnackbarProvider } from 'notistack'

function MyApp({ Component, pageProps }: AppProps) {
  const config = getAlephiumNFTConfig()
  return (
    <ThemeProvider attribute="class">
      <SnackbarProvider maxSnack={3}>
        <AlephiumWalletProvider useTheme="retro" addressGroup={config.groupIndex} network={config.network}>
          <div className="dark:bg-nft-dark bg-white min-h-screen">
            <Head>
              <title>Alephium</title>
              <meta name="viewport" content="initial-scale=1.0, width=device-width" />
            </Head>
            <Navbar />
            <div className="pt-65">
              <Component {...pageProps} />
            </div>
          </div>

          <Script src="https://kit.fontawesome.com/77a74156e4.js" crossOrigin="anonymous" />
        </AlephiumWalletProvider>
      </SnackbarProvider>
    </ThemeProvider>
  )
}

export default MyApp