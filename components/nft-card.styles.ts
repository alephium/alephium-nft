import styled, { css } from 'styled-components';
import { color, resetCSS } from '@web3uikit/styles';
import { INFTCardProps } from './nft-card';

const DivStyled = styled.div<Partial<INFTCardProps>>`
    overflow: auto;
    padding-bottom: 10px;
`;

const DivStyledContainer = styled.div<Partial<INFTCardProps>>`
    ${resetCSS};
    background-color: color.white;
    border: 'none';
    border-radius: '20px';
    color: color.blue70;
    font-size: '16px';
    font-weight: '550';
    height: min(830px, auto);
    margin: auto;
    overflow: auto;
    padding: '32px';
    text-align: center;
    .nft-image > * {
        border-radius: 20px;
        margin-bottom: 16px;
        max-width: 370px;
        object-fit: contain;
        width: 100%;
    }
    .nft-card-text {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
    ${(props) =>
    props.width &&
    css`
            width: ${props.width};
        `}
`;

const FieldsetStyled = styled.fieldset<Partial<INFTCardProps>>`
    margin-top: 10px;
    text-align: left;
    legend {
        color: ${color.blue70};
        font-family: inherit;
        font-size: 20px;
        font-weight: 600;
        line-height: 28px;
    }
    table,
    tr {
        text-align: left;
        width: 100%;
        max-width: 370px;
        overflow: hidden;
    }
    th,
    td {
        color: ${color.blueGray50};
        font-size: 16px;
        font-weight: 700;
        line-height: 24px;
    }
    td {
        font-weight: 400;
        max-width: 140px;
        text-overflow: ellipsis;
    }
    .address {
        color: ${color.navy40};
    }
    ${(p) =>
    p.detailsBorder !== 'none'
      ? css`
                  border: ${p.detailsBorder ?? `2px solid ${color.navy30}`};
                  border-radius: 16px;
                  padding: 12px 24px;
                  legend {
                      color: ${color.navy40};
                      font-family: inherit;
                      font-size: 14px;
                      font-weight: 550;
                      line-height: 24px;
                  }
              `
      : 'border:none'}
`;

const DivButton = styled.div<Partial<INFTCardProps>>`
    float: right;
`;

export default {
  DivStyled,
  DivStyledContainer,
  FieldsetStyled,
  DivButton
};
