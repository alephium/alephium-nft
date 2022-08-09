import * as web3 from '@alephium/web3'
import { useContext, useEffect, useState } from 'react'
import { NFTContract } from '../utils/contracts'
import { addressFromContractId } from '@alephium/web3'
import { NFTMarketplace } from '../utils/nft-marketplace'
import { NFTCollection } from '../utils/nft-collection'
import addresses from '../configs/addresses.json'
import { AlephiumWeb3Context } from './alephium-web3-providers'
import axios from 'axios'
import TxStatusAlert, { useTxStatus } from './tx-status-alert'

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

    async function loadNFT(tokenId: string): Promise<NFT | undefined> {
        var nftState = undefined

        if (context.nodeProvider) {
            try {
                nftState = await NFTContract.fetchState(context.nodeProvider, addressFromContractId(tokenId), 0)
            } catch (e) {
                console.debug(`error fetching state for ${tokenId}`, e)
            }

            if (nftState && nftState.codeHash === NFTContract.codeHash) {
                const metadataUri = web3.hexToString(nftState.fields.uri)
                const metadata = (await axios.get(metadataUri)).data
                return {
                    name: metadata.name,
                    description: metadata.description,
                    image: metadata.image,
                    tokenId: tokenId,
                    collectionAddress: nftState.fields.collectionAddress
                }
            }
        }
    }

    async function loadNFTs() {
        const items = []

        console.log("load nft", context.accounts)
        if (context.nodeProvider && context.accounts && context.accounts[0] && context.accounts[0].address) {
            const balances = await context.nodeProvider.addresses.getAddressesAddressBalance(context.accounts[0].address)
            const tokenBalances = balances.tokenBalances !== undefined ? balances.tokenBalances : []
            const tokens = tokenBalances
                .filter((token) => +token.amount == 1)
                .map((token) => token.id)

            for (var token of tokens) {
                const nft = await loadNFT(token)
                nft && items.push(nft)
            }

            setNfts(items)
        }

        setLoadingState('loaded')
    }

    async function sellNFT(nft: NFT) {
        if (context.nodeProvider && context.signerProvider && context.accounts && context.accounts[0]) {
            const nftMarketplace = new NFTMarketplace(
                context.nodeProvider,
                context.signerProvider.provider,
                context.accounts[0].address
            )
            const nftCollection = new NFTCollection(
                context.nodeProvider,
                context.signerProvider.provider,
                context.accounts[0].address
            )

            const depositNFTTxResult = await nftCollection.depositNFT(nft.tokenId)

            setOngoingTxId(depositNFTTxResult.txId)
            setOngoingTxDescription('depositing NFT')
            setTxStatusCallback(() => async (txStatus: web3.node.TxStatus) => {
                if (txStatus.type === 'Confirmed') {
                    const listNFTTxResult = await nftMarketplace.listNFT(nft.tokenId, 1000, addresses.marketplaceContractId)

                    setOngoingTxId(listNFTTxResult.txId)
                    setOngoingTxDescription('listing NFT')
                    setTxStatusCallback(() => async (txStatus: web3.node.TxStatus) => {
                        if (txStatus.type === 'Confirmed') {
                            resetTxStatus()
                            await loadNFTs()
                        } else if (txStatus.type === 'TxNotFound') {
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