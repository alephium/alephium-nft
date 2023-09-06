import React, { ChangeEventHandler } from 'react';

interface InputProps {
  inputType: 'textarea' | 'alph' | 'positiveInteger' | 'input' | '',
  title: string,
  placeholder: string,
  handleClick: ChangeEventHandler
  value?: string
}

const positiveNumRegex = new RegExp('^[1-9][0-9]*$')

function checkNumber(e: any, callback: (e: any) => void) {
  if (positiveNumRegex.test(e.target.value) || e.target.value === '') {
    callback(e)
  }
}

const Input = ({ inputType, title, placeholder, handleClick, value }: InputProps) => {
  return (
    <div className="mt-10 w-full">
      <p className="font-poppins dark:text-white text-nft-black-1 font-semibold text-xl">{title}</p>

      {inputType === 'alph' ? (
        <div className="dark:bg-nft-black-1 bg-white border dark:border-nft-black-1 border-nft-gray-2 rounded-lg w-full outline-none font-poppins dark:text-white text-nft-gray-2 text-base mt-4 px-4 py-3 flexBetween flex-row">
          <input
            type="number"
            className="flex w-full dark:bg-nft-black-1 bg-white outline-none"
            placeholder={placeholder}
            onChange={handleClick}
          />
          <p className="font-poppins dark:text-white text-nft-black-1 font-semibold text-xl">ALPH</p>
        </div>
      ) : inputType === 'positiveInteger' ? (
        <div className="dark:bg-nft-black-1 bg-white border dark:border-nft-black-1 border-nft-gray-2 rounded-lg w-full outline-none font-poppins dark:text-white text-nft-gray-2 text-base mt-4 px-4 py-3 flexBetween flex-row">
          <input
            type="text"
            className="flex w-full dark:bg-nft-black-1 bg-white outline-none"
            placeholder={placeholder}
            onChange={(e) => checkNumber(e, handleClick)}
            value={value}
          />
        </div>
      ) : inputType === 'textarea' ? (
        <textarea
          rows={10}
          className="dark:bg-nft-black-1 bg-white border dark:border-nft-black-1 border-nft-gray-2 rounded-lg w-full outline-none font-poppins dark:text-white text-nft-gray-2 text-base mt-4 px-4 py-3"
          placeholder={placeholder}
          onChange={handleClick}
        />
      ) : (
        <input
          className="dark:bg-nft-black-1 bg-white border dark:border-nft-black-1 border-nft-gray-2 rounded-lg w-full outline-none font-poppins dark:text-white text-nft-gray-2 text-base mt-4 px-4 py-3"
          placeholder={placeholder}
          onChange={handleClick}
          value={value}
        />
      )}
    </div>
  );
};

export default Input;
