interface ButtonProps {
  btnName: string,
  classStyles: string,
  handleClick: () => any,
  disabled?: boolean
}

const Button = ({ btnName, classStyles, handleClick, disabled }: ButtonProps) => (
  <button
    type="button"
    className={`nft-gradient text-sm minlg:text-lg py-2 px-6 minlg:px-8 font-poppins font-semibold text-white transform transition duration-500 hover:scale-105 ${classStyles} ${disabled ? "disabled" : ""}`}
    onClick={handleClick}
    disabled={!!disabled}
  >
    {btnName}
  </button>
);

export default Button;
