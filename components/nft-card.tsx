import React, { useState } from 'react';
import styles from './nft.styles';
import { color } from '@web3uikit/styles';
import { Typography, TruncateString, Illustration, Button } from '@web3uikit/core';
import NFTDetails from './nft-details';
import { image } from '../utils/nft-card'

const { DivStyled, DivStyledContainer, FieldsetStyled, DivRightButton } = styles;

export interface INFTCardProps {
  tokenInfo: {
    token_address: string;
    token_id: string;
    collection_id?: string,
    amount?: string;
    owner_of?: string;
    name?: string;
    description?: string;
    metadata?: string;
    listed?: boolean;
    listingInfo?: {
      totalAmount: string,
      price: string,
      commission: string,
      deposit: string,
      gas: string,
      buyNFT: () => void;
    }
  };
  /**
   * width of the card
   */
  width?: string;
  /**
   * set border for details section
   */
  detailsBorder?: string;
  sellingNFT?: () => void;
}

export const NFTCard: React.FC<INFTCardProps &
  React.HTMLAttributes<HTMLDivElement>> = ({
    detailsBorder,
    tokenInfo: data,
    width = '400px',
    sellingNFT,
    ...props
  }) => {
    const [isError, setIsError] = useState(false);

    if (!data || !data.metadata) return <DivStyled>No metadata</DivStyled>;

    const getImage = () => {
      if (!data.metadata) return null;
      try {
        return image(
          JSON.parse(String(data.metadata))?.animation_url,
          JSON.parse(String(data.metadata))?.image,
          JSON.parse(String(data.metadata))?.type,
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
                text={`${data.name}`}
                fontSize="20px"
                textColor={color.blue70}
              />
            </Typography>
            <Typography variant="subtitle1" weight="300" fontSize="10px">
              <TruncateString
                text={`${data.description}`}
                fontSize="12px"
                textColor={color.blue70}
              />
            </Typography>
          </div>
          <DivRightButton>
            {
              sellingNFT && (
                data.listed ?
                  <Button theme='translucent' disabled={true} text="Listed" /> :
                  <Button theme='outline' onClick={() => sellingNFT()} text="Sell Now" />
              )
            }
            {
              data?.listingInfo?.buyNFT && (
                <Button theme='outline' onClick={() => data.listingInfo && data.listingInfo.buyNFT()} text="Buy Now" />
              )
            }
          </DivRightButton>
          <FieldsetStyled detailsBorder={detailsBorder}>
            <legend>Details</legend>
            <NFTDetails data={data} />
          </FieldsetStyled>
        </DivStyledContainer>
      </DivStyled>
    );
  };

export default NFTCard;
