import * as web3 from 'alephium-web3'
import { checkHexString, subContractId } from '../helpers/utils'
import { testAddress1 } from '../helpers/signer'
import { timeout } from './utils'
import { Web3Helpers } from '../helpers/web3-helpers'

export class NFTCollection extends Web3Helpers {

  async create(
    collectionName: string,
    collectionSymbol: string,
    collectionUri: string
  ): Promise<[string, string, number]> {
    const nftContract = await web3.Contract.fromSource(this.provider, 'nft.ral')

    const nftCollectionDeployTx = await this.createContract(
      'nft_collection.ral',
      {
        initialFields: {
          nftByteCode: nftContract.bytecode,
          collectionName: web3.stringToHex(collectionName),
          collectionSymbol: web3.stringToHex(collectionSymbol),
          collectionUri: web3.stringToHex(collectionUri)
        }
      }
    )

    return [
      nftCollectionDeployTx.contractId,
      nftCollectionDeployTx.contractAddress,
      nftCollectionDeployTx.fromGroup
    ]
  }

  async mintNFT(
    nftCollectionContractId: string,
    nftCollectionContractAddress: string,
    nftCollectionContractGroup: number,
    nftName: string,
    nftSymbol: string,
    nftUri: string
  ): Promise<string> {
    await this.callTxScript(
      'mint_nft.ral',
      {
        initialFields: {
          nftCollectionContractId: nftCollectionContractId,
          name: web3.stringToHex(nftName),
          symbol: web3.stringToHex(nftSymbol),
          uri: web3.stringToHex(nftUri)
        },
        gasAmount: 200000  // TODO: set appropriately
      }
    )

    await timeout(3000)

    const nftCollectionContractEvents = await this.provider.events.getEventsContractContractaddress(
      nftCollectionContractAddress,
      { start: 0, group: nftCollectionContractGroup }
    )

    expect(nftCollectionContractEvents.events.length).toEqual(1)

    const nftMintedEventFields = nftCollectionContractEvents.events[0].fields
    // Check minter address
    expect(nftMintedEventFields[0].value).toEqual(testAddress1)
    // Check collection address
    expect(nftMintedEventFields[1].value).toEqual(nftCollectionContractAddress)
    // Check info of the minted NFT
    expect(checkHexString(nftMintedEventFields[2].value, nftName))
    expect(checkHexString(nftMintedEventFields[3].value, nftSymbol))
    expect(checkHexString(nftMintedEventFields[4].value, nftUri))

    const nftContractId = subContractId(nftCollectionContractId, web3.stringToHex(nftUri))
    expect(nftMintedEventFields[5].value).toEqual(nftContractId)

    const nftContractAddress = nftMintedEventFields[6].value.toString()
    return nftContractAddress
  }

  async burnNFT(nftContractId: string, gasAmount?: number, gasPrice?: number) {
    await this.callTxScript(
      'burn_nft.ral',
      {
        initialFields: {
          nftContractId: nftContractId
        },
        gasAmount: gasAmount,
        gasPrice: gasPrice
      }
    )
  }
}