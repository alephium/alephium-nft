import { useContext, useEffect, useState } from 'react'
import { addressFromContractId, binToHex, contractIdFromAddress } from '@alephium/web3'
import { NFTMarketplace } from '../scripts/nft-marketplace'
import { NFTCollection } from '../scripts/nft-collection'
import addresses from '../configs/addresses.json'
import { NFTListingContract } from '../utils/contracts'
import { hexToString } from '../utils'
import axios from 'axios'
import { AlephiumWeb3Context } from './alephium-web3-providers'

interface NFTListing {
    price: number
    name: string,
    description: string,
    image: string,
    tokenId: string,
    tokenOwner: string,
    marketAddress: string
    commissionRate: number,
    listingContractId: string
}

export default function BuyNFTs() {
    const [nftListings, setNftListings] = useState([] as NFTListing[])
    const [loadingState, setLoadingState] = useState('not-loaded')
    const context = useContext(AlephiumWeb3Context)

    useEffect(() => {
        loadListedNFTs()
    }, [context.accounts])

    async function loadListedNFT(event): NFTListing | undefined {

        const tokenId = event.fields[1].value
        const listingContractId = event.fields[3].value

        if (context.nodeProvider) {
            var listingState = undefined

            try {
                listingState = await context.nodeProvider.contracts.getContractsAddressState(
                    addressFromContractId(listingContractId),
                    { group: 0 }
                )
            } catch (e) {
                console.log(`error fetching state for ${tokenId}`, e)
            }

            if (listingState && listingState.codeHash === NFTListingContract.codeHash) {
                const nftState = await context.nodeProvider.contracts.getContractsAddressState(
                    addressFromContractId(tokenId),
                    { group: 0 }
                )

                const metadataUri = hexToString(nftState.fields[3].value)
                const metadata = (await axios.get(metadataUri)).data
                return {
                    price: listingState.fields[0].value,
                    name: metadata.name,
                    description: metadata.description,
                    image: metadata.image,
                    tokenId: tokenId,
                    tokenOwner: listingState.fields[2].value,
                    marketAddress: listingState.fields[3].value,
                    commissionRate: listingState.fields[4].value,
                    listingContractId: listingContractId
                }
            }
        }
    }

    async function loadListedNFTs() {
        // Setup marketplace and get all the listed NFTListed
        //
        //   event NFTListed(
        //     price: U256,
        //     tokenId: ByteVec,
        //     tokenOwner: Address,
        //     listingContractId: ByteVec,
        //     listingContractAddress: Address
        //   )
        //
        const items = new Map<string, NFTListing>()

        console.log('context.account', context.accounts)
        if (context.nodeProvider && context.signerProvider && context.accounts && context.accounts[0]) {
            const nftMarketplace = new NFTMarketplace(
                context.nodeProvider,
                context.signerProvider,
                context.accounts[0].address
            )
            const marketplaceContractAddress = addressFromContractId(addresses.marketplaceContractId)
            const events = await nftMarketplace.getListedNFTs(marketplaceContractAddress)

            for (var event of events) {
                const listedNFT = await loadListedNFT(event)
                listedNFT && items.set(listedNFT.listingContractId, listedNFT)
            }
        }


        setNftListings(Array.from(items.values()))
        setLoadingState('loaded')
    }

    async function buyNft(nftListing) {
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

            await nftMarketplace.buyNFT(
                2000000000000000000,
                binToHex(contractIdFromAddress(nftListing.marketAddress)),
                nftListing.listingContractId
            )
            await nftCollection.withdrawNFT(nftListing.tokenId)
            await loadListedNFTs()
        }
    }

    if (loadingState === 'loaded' && !nftListings.length) return (<h1 className="px-20 py-10 text-3xl">No NFTs for sale</h1>)
    return (
        <div className="flex justify-center">
            <div className="px-4" style={{ maxWidth: '1600px' }}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                    {
                        nftListings.map((nftListing, i) => (
                            <div key={i} className="border shadow rounded-xl overflow-hidden">
                                <img src={nftListing.image} />
                                <div className="p-4">
                                    <p style={{ height: '64px' }} className="text-2xl font-semibold">{nftListing.name}</p>
                                    <div style={{ height: '70px', overflow: 'hidden' }}>
                                        <p className="text-gray-400">{nftListing.description}</p>
                                    </div>
                                </div>
                                <div className="p-4 bg-black">
                                    <p className="text-2xl font-bold text-white">{nftListing.price} ALPH </p>
                                    <button className="mt-4 w-full bg-pink-500 text-white font-bold py-2 px-12 rounded" onClick={() => buyNft(nftListing)}>Buy</button>
                                </div>
                            </div>
                        ))
                    }
                </div>
            </div>
        </div>
    )
}