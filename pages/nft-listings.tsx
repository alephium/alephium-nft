import { ListNFTListings } from '../components/NFTListing';

export default function NFTListings() {
  return (
    <div className="flex justify-center p-12">
      <div className="w-full ml-32 mr-32 md:ml-20 md:mr-20 sm:ml-10 sm:mr-10">
        <ListNFTListings/>
      </div>
    </div>
  )
}