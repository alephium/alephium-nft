import React, { useState } from 'react';
import styles from './nft.styles';
import { color } from '@web3uikit/styles';
import { Typography, TruncateString, Illustration, CopyButton } from '@web3uikit/core';
import { image } from '../utils/nft-card'
import { getEllipsisTxt } from './nft-details';
import Link from 'next/link'

const { FieldsetStyled, DivStyled, DivStyledContainer } = styles;

export interface INFTCollectionCardProps {
  id?: string
  name: string
  description: string
  imageUrl: string
  totalSupply: bigint
  /**
   * width of the card
   */
  width?: string;
  /**
   * set border for details section
   */
  detailsBorder?: string;
  mint: () => void;
}

export const NFTCollectionCard: React.FC<INFTCollectionCardProps &
  React.HTMLAttributes<HTMLDivElement>> = ({
    detailsBorder,
    id,
    name,
    description,
    imageUrl,
    totalSupply,
    width = '400px',
    mint,
    ...props
  }) => {
    const [isError, setIsError] = useState(false);

    const getImage = () => {
      try {
        return image(
          undefined,
          imageUrl,
          undefined,
          () => setIsError(true),
        );
      } catch (error) {
        return <Illustration logo="lazyNft" />;
      }
    };

    return (
      <DivStyled
        {...props}
      >
        <DivStyledContainer width={width}>
          <div className="nft-image">
            {isError ? <Illustration logo="lazyNft" /> : getImage()}
          </div>
          <div className="nft-card-text">
            <Typography variant="h4" weight="500" fontSize="20px">
              <TruncateString
                text={`${name}`}
                fontSize="20px"
                textColor={color.blue70}
              />
            </Typography>
            <Typography variant="h6" weight="300" fontSize="10px">
              <TruncateString
                text={`${description}`}
                fontSize="12px"
                textColor={color.blue70}
              />
            </Typography>
          </div>
          <FieldsetStyled detailsBorder={detailsBorder}>
            <legend>Collection Details</legend>
            <table>
              <tbody>
                {
                  id && (
                    <tr>
                      <th>Collection Id</th>
                      <td className="address">
                        {getEllipsisTxt(id, 4)}{' '}
                        <CopyButton text={id} iconSize={20} />
                      </td>
                    </tr>
                  )
                }
                <tr>
                  <th>Total Supply</th>
                  <td>
                    {totalSupply.toString()}
                  </td>
                </tr>
                <tr>
                  <th><Link href={`/mint-nfts?collectionId=${id}`}><a className="mr-6 text-blue-500">Mint More </a></Link></th>
                </tr>
              </tbody>
            </table >
          </FieldsetStyled>
        </DivStyledContainer>
      </DivStyled >
    );
  };

export default NFTCollectionCard;
