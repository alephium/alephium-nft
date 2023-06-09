import Image from 'next/image';

import images from '../assets';

interface LoaderWithTextProps {
  text: string
}

const LoaderWithText = ({ text }: LoaderWithTextProps) => (
  <div className="flexCenter my-4">
    <Image src={images.loader} alt="loader" width={100} objectFit="contain" />
    {text}
  </div>
);

export default LoaderWithText;
