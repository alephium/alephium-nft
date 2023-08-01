import { Address } from "@alephium/web3";
import axios from "axios"
import { useEffect, useState } from "react";
import { NFTCard, SearchBar } from '.';
import { InfiniteScroll } from "./InfiniteScroll";
import { NFTSkeletonLoader } from "./NFTCard";
import { backendUrl } from "../../configs/nft";

export interface NFTListing {
  _id: string,
  price: bigint
  name: string,
  description: string,
  image: string,
  tokenOwner: string,
  marketAddress: string
  listingContractId: string,
  collectionId: string
}

function toPriceOrder(activeSelect: string): string | undefined {
  switch (activeSelect) {
    case 'Price (low to high)':
      return 'asc'
    case 'Price (high to low)':
      return 'desc'
    case 'Recently Listed':
      return undefined
  }
}

export async function fetchNFTListings(
  priceOrder?: string,
  searchText?: string,
  page?: number,
  size?: number
): Promise<NFTListing[]> {
  let url: string = `${backendUrl}/api/nft-listings?page=${page || 0}`
  if (size) {
    url = `${url}&size=${size}`
  }
  if (priceOrder) {
    url = `${url}&priceOrder=${priceOrder}`
  }
  if (searchText) {
    url = `${url}&search=${searchText}`
  }

  const result = await axios.get(url)
  return result.data
}

export async function fetchNFTListingById(id: string): Promise<NFTListing | undefined> {
  const result = await axios.get(`${backendUrl}/api/nft-listing-by-id/${id}`)
  return result.data === null ? undefined : result.data
}

export async function fetchNFTListingsByOwner(owner: Address): Promise<NFTListing[]> {
  const result = await axios.get(`${backendUrl}/api/nft-listings-by-owner/${owner}`)
  return result.data
}

export function ListNFTListings() {
  const [activeSelect, setActiveSelect] = useState<string>('Recently Listed')
  const [searchText, setSearchText] = useState<string>('')
  const [nftListings, setNftListing] = useState<(NFTListing | undefined)[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [hasMore, setHasMore] = useState<boolean>(false)
  const [totalCount, setTotalCount] = useState<number | undefined>()
  const [page, setPage] = useState<number>(0)
  const pageSize = 20

  useEffect(() => {
    let cancelled = false
    const fetch = async () => {
      try {
        const totalResult = await axios.get(`${backendUrl}/api/nft-listings-count?search=${searchText}`)
        if (!cancelled) {
          setTotalCount(totalResult.data.total)
        }
      } catch (err) {
        console.error(`failed to fetch total count, error: ${err}`)
      }
    }
    fetch()
    return () => {
      cancelled = true
    }
  }, [searchText, activeSelect])

  useEffect(() => {
    if (totalCount === undefined || totalCount === 0) return

    let cancelled = false
    setIsLoading(true)
    setNftListing(prev => {
      const remainCount = totalCount - prev.length
      const fetchCount = remainCount > pageSize ? pageSize : remainCount
      return [...prev, ...Array(fetchCount).fill(undefined)]
    })
    fetchNFTListings(toPriceOrder(activeSelect), searchText, page, pageSize)
      .then((listings) => {
        if (!cancelled) {
          setHasMore(listings.length === pageSize)
          setIsLoading(false)
          setNftListing(prev => [...prev.filter((v) => v !== undefined), ...listings])
        }
      })
      .catch((err) => {
        if (!cancelled) setIsLoading(false)
        console.error(`failed to load nft listings, error: ${err}`)
      })
    return () => {
      cancelled = true
    }
  }, [page, searchText, activeSelect, totalCount])

  const onNextPage = () => {
    setPage(prevPage => prevPage + 1)
  }

  const reset = () => {
    setNftListing([])
    setPage(0)
    setIsLoading(false)
    setHasMore(false)
    setTotalCount(undefined)
  }

  const onHandleSearch = (value: string) => {
    setSearchText((prev) => {
      if (prev !== value) reset()
      return value
    })
  };

  const onClearSearch = () => {
    setSearchText((prev) => {
      if (prev != '') reset()
      return ''
    })
  };

  const onActiveSelectChange = (value: string) => {
    setActiveSelect((prev) => {
      if (prev !== value) reset()
      return value
    })
  }

  const displayNFTListings = (listings: (NFTListing | undefined)[]) => {
    return listings.map((nft, index) => {
      if (nft === undefined) {
        return <NFTSkeletonLoader key={index}/>
      } else {
        return <NFTCard key={nft._id} nft={{tokenId: nft._id, minted: true, ...nft}}/>
      }
    })
  }

  return (
    <div>
    <div className="mt-10">
      <div className="flexBetween mx-4 xs:mx-0 minlg:mx-8 sm:flex-col sm:items-start">
        <h1 className="flex-1 font-poppins dark:text-white text-nft-black-1 text-2xl minlg:text-4xl font-semibold sm:mb-4">❇️  Hot Listings</h1>
        <div className="flex-2 sm:w-full flex flex-row sm:flex-col">
          <SearchBar
            activeSelect={activeSelect}
            setActiveSelect={onActiveSelectChange}
            handleSearch={onHandleSearch}
            clearSearch={onClearSearch}
          />
        </div>
      </div>
      <InfiniteScroll onNextPage={onNextPage} hasMore={hasMore} isLoading={isLoading}>
        {({bottomSentinelRef}) => {
          return <>
            <div className="mt-3">
              <div className="grid-container">
                {displayNFTListings(nftListings)}
              </div>
            </div>
            <div ref={bottomSentinelRef}></div>
          </>
        }}
      </InfiniteScroll>
      {
        (totalCount !== undefined && totalCount === 0) ? (
          <div className="flex justify-center sm:px-4 p-12" >
            <h1 className="font-poppins dark:text-white text-nft-black-1 text-2xl minlg:text-4xl font-semibold ml-4 xs:ml-0">
              No NFT Listing found
            </h1>
          </div>
        ) : null
      }
    </div>
    </div>
  )
}