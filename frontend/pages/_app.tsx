/* pages/_app.js */
import { AppProps } from 'next/app'
import { AlephiumConnectProvider } from '@alephium/web3-react'
import { NETWORK, groupIndex } from '../../configs/nft'
import { ThemeProvider } from 'next-themes';
import Head from 'next/head';
import { Navbar } from '../components';
import Script from 'next/script';
import '../styles/globals.css'
import { SnackbarProvider } from 'notistack'

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider attribute="class">
      <SnackbarProvider maxSnack={3}>
        <AlephiumConnectProvider useTheme="retro" addressGroup={groupIndex} network={NETWORK}>
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
        </AlephiumConnectProvider>
      </SnackbarProvider>
    </ThemeProvider>
  )
}

export default MyApp