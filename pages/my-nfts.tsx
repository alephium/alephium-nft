import * as web3 from '@alephium/web3'
import { useContext, useEffect, useState } from 'react'
import { NFTContract } from '../utils/contracts'
import { hexToString } from '../utils'
import { addressFromContractId } from '@alephium/web3'
import { NFTMarketplace } from '../utils/nft-marketplace'
import { NFTCollection } from '../utils/nft-collection'
import addresses from '../configs/addresses.json'
import { AlephiumWeb3Context } from './alephium-web3-providers'
import axios from 'axios'
import { TxStatusAlert, useTxStatus } from './tx-status-alert'

interface NFT {
    name: string,
    description: string,
    image: string,
    tokenId: string,
    collectionAddress: string
}

export default function Home() {
    const [nfts, setNfts] = useState([] as NFT[])
    const [loadingState, setLoadingState] = useState('not-loaded')
    const context = useContext(AlephiumWeb3Context)

    const [
        ongoingTxId,
        setOngoingTxId,
        ongoingTxDescription,
        setOngoingTxDescription,
        txStatusCallback,
        setTxStatusCallback,
        resetTxStatus
    ] = useTxStatus()

    console.debug('Accounts in my-nft', context.accounts)

    useEffect(() => {
        loadNFTs()
    }, [context.accounts])

    async function loadNFT(tokenId: string): undefined | NFT {
        var nftState = undefined

        if (context.nodeProvider) {
            try {
                nftState = await context.nodeProvider.contracts.getContractsAddressState(
                    addressFromContractId(tokenId),
                    { group: 0 }
                )
            } catch (e) {
                console.debug(`error fetching state for ${tokenId}`, e)
            }

            if (nftState && nftState.codeHash === NFTContract.codeHash) {
                const metadataUri = hexToString(nftState.fields[3].value)
                const metadata = (await axios.get(metadataUri)).data
                return {
                    name: metadata.name,
                    description: metadata.description,
                    image: metadata.image,
                    tokenId: tokenId,
                    collectionAddress: nftState.fields[4].value
                }
            }
        }
    }

    async function loadNFTs() {
        const items = []

        if (context.nodeProvider && context.accounts && context.accounts[0]) {
            const utxos = await context.nodeProvider.addresses.getAddressesAddressUtxos(
                context.accounts[0].address
            )

            const tokens = utxos.utxos
                .flatMap((utxo) => utxo.tokens)
                .filter((token) => token.amount == 1)
                .map((token) => token.id)

            for (var token of tokens) {
                const nft = await loadNFT(token)
                nft && items.push(nft)
            }

            setNfts(items)
        }

        setLoadingState('loaded')
    }

    async function sellNFT(nft) {
        if (context.nodeProvider && context.signerProvider && context.accounts && context.accounts[0]) {
            const nftMarketplace = new NFTMarketplace(
                context.nodeProvider,
                context.signerProvider,
                context.accounts[0].address
            )
            const nftCollection = new NFTCollection(
                context.nodeProvider,
                context.signerProvider,
                context.accounts[0].address
            )

            const depositNFTTxResult = await nftCollection.depositNFT(nft.tokenId)

            setOngoingTxId(depositNFTTxResult.txId)
            setOngoingTxDescription('depositting NFT')
            setTxStatusCallback(() => async (txStatus: web3.node.TxStatus) => {
                if (txStatus.type === 'Confirmed') {
                    const listNFTTxResult = await nftMarketplace.listNFT(nft.tokenId, 1000, addresses.marketplaceContractId)

                    setOngoingTxId(listNFTTxResult.txId)
                    setOngoingTxDescription('listing NFT')
                    setTxStatusCallback(() => async (txStatus2: web3.node.TxStatus) => {
                        if (txStatus2.type === 'Confirmed') {
                            resetTxStatus()
                            await loadNFTs()
                        } else if (txStatus2.type === 'TxNotFound') {
                            resetTxStatus()
                            console.error('List NFT transaction not found')
                        }
                    })
                } else if (txStatus.type === 'TxNotFound') {
                    resetTxStatus()
                    console.error('Deposit NFT transaction not found')
                }
            })
        }
    }

    if (loadingState === 'loaded' && !nfts.length) return (<h1 className="px-20 py-10 text-3xl">I have no NFTs</h1>)
    return (
        <>
            {
                ongoingTxId ? <TxStatusAlert txId={ongoingTxId} description={ongoingTxDescription} txStatusCallback={txStatusCallback} /> : undefined
            }

            <div className="flex justify-center">
                <div className="px-4" style={{ maxWidth: '1600px' }}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                        {
                            nfts.map((nft, i) => (
                                <div key={i} className="border shadow rounded-xl overflow-hidden">
                                    <img src={nft.image} />
                                    <div className="p-4">
                                        <p style={{ height: '64px' }} className="text-2xl font-semibold">{nft.name}</p>
                                        <div style={{ height: '70px', overflow: 'hidden' }}>
                                            <p className="text-gray-400">{nft.description}</p>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-black">
                                        <button className="mt-4 w-full bg-pink-500 text-white font-bold py-2 px-12 rounded" onClick={() => sellNFT(nft)}>Sell</button>
                                    </div>
                                </div>
                            ))
                        }
                    </div>
                </div>
            </div>
        </>
    )
}