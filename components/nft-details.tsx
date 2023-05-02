import React from 'react';
import { CopyButton, LinkTo } from '@web3uikit/core'
import { INFTCardProps } from './nft-card'

export const getEllipsisTxt = (str: string, n = 6) => {
  if (str) {
    return `${str.slice(0, n)}...${str.slice(str.length - n)}`;
  }
  return '';
};

const NFTDetails: React.FC<{
  data: INFTCardProps['tokenInfo'];
}> = ({ data }) => {
  return (
    <table>
      <tbody>
        <tr>
          <th>Token Id</th>
          <td className="address">
            {getEllipsisTxt(data?.token_id, 4)}{' '}
            <CopyButton text={data?.token_id} iconSize={20} />
          </td>
        </tr>
        {data?.owner_of && (
          <tr>
            <th>Owner Address</th>
            <td className="address">
              {getEllipsisTxt(data.owner_of, 4)}{' '}
              <CopyButton text={data?.owner_of} iconSize={20} />
            </td>
          </tr>
        )}
        {data?.collection_id && (
          <tr>
            <th>Collection</th>
            <td className="address">
              <LinkTo
                address={`/collections?collectionId=${data.collection_id}`}
                type="external"
                iconLayout="trailing"
                isUnderlined={false}
                text={getEllipsisTxt(data.collection_id, 4)}
              />
            </td>
          </tr>
        )}
        {data?.listingInfo?.totalAmount && (
          <tr>
            <th>Total Amount</th>
            <td>
              {data?.listingInfo?.totalAmount}
            </td>
          </tr>
        )}
        {data?.listingInfo?.price && (
          <tr>
            <th>Price</th>
            <td>
              {data?.listingInfo?.price}
            </td>
          </tr>
        )}
        {data?.listingInfo?.commission && (
          <tr>
            <th>Commission</th>
            <td>
              {data?.listingInfo?.commission}
            </td>
          </tr>
        )}
        {data?.listingInfo?.gas && (
          <tr>
            <th>Gas</th>
            <td>
              {data?.listingInfo?.gas}
            </td>
          </tr>
        )}
        {data?.listingInfo?.deposit && (
          <tr>
            <th>Deposit</th>
            <td>
              {data?.listingInfo?.deposit}
            </td>
          </tr>
        )}
      </tbody>
    </table >
  );
};

export default NFTDetails;
