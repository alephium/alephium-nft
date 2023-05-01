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
      </tbody>
    </table >
  );
};

export default NFTDetails;
