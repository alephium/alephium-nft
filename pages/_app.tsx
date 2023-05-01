/* pages/_app.js */
import '../styles/globals.css'
import Link from 'next/link'
import { AppProps } from 'next/app'
import { AlephiumConnectButton, AlephiumConnectProvider } from '@alephium/web3-react'
import { NETWORK } from '../configs/nft'
import styles from '../styles/Home.module.css'
import Image from "next/image";
import Logo from "../public/alephium-logo.svg";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <section className={styles.container}>
      <AlephiumConnectProvider useTheme="retro" addressGroup={0} network={NETWORK}>
        <section>
          <section className={styles.viewCollection}>
            <section className={styles.collectionHeader}>
              <section className={styles.logo}>
                <Link href="/">
                  <Image src={Logo} alt="Blur Logo" width="70" height="" />
                </Link>
              </section>
              <section className={styles.nav}>
                <section className={styles.nav_items}>
                  <Link href="/my-nfts">
                    <p> My Porfolio </p>
                  </Link>
                  <Link href="/create-collections">
                    <p> Create Collections </p>
                  </Link>
                  <Link href="/buy-nfts">
                    <p> Buy NFTs </p>
                  </Link>
                </section>
                <section className={styles.connect_btn}>
                  <AlephiumConnectButton />
                </section>
              </section>
            </section>
            <section className={styles.collectionMain}>
              <Component {...pageProps} />
            </section>
          </section>
        </section>
      </AlephiumConnectProvider >
    </section>
  )
}

export default MyApp