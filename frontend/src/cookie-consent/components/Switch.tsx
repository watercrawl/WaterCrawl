const Switch: React.FC<{
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}> = ({ checked, onChange, disabled = false }) => {
  return (
    <label
      className={`relative inline-flex cursor-pointer items-center ${disabled ? 'cursor-not-allowed opacity-50' : ''} `}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="peer sr-only"
      />
      <div
        className={`h-5 w-10 rounded-full transition-all duration-300 ease-in-out ${checked ? 'bg-primary peer-focus:ring-primary' : 'bg-muted peer-focus:ring-border'} after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:border after:border-input-border after:bg-card after:transition-all after:duration-300 after:content-[''] peer-checked:after:translate-x-[18px] peer-checked:after:border-white peer-focus:ring-2`}
      ></div>
    </label>
  );
};

export default Switch;
