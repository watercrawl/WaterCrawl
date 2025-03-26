const Switch: React.FC<{
    checked: boolean;
    onChange: () => void;
    disabled?: boolean;
}> = ({ checked, onChange, disabled = false }) => {
    return (
        <label
            className={`
          inline-flex relative items-center cursor-pointer
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        >
            <input
                type="checkbox"
                checked={checked}
                onChange={onChange}
                disabled={disabled}
                className="sr-only peer"
            />
            <div
                className={`
            w-10 h-5 rounded-full 
            transition-all duration-300 ease-in-out
            ${checked ? 'bg-blue-500 peer-focus:ring-blue-300 dark:bg-blue-600 dark:peer-focus:ring-blue-800' : 'bg-gray-300 peer-focus:ring-gray-300 dark:bg-gray-600 dark:peer-focus:ring-gray-400'}
            peer-focus:ring-2
            peer-checked:after:translate-x-[18px]
            peer-checked:after:border-white
            after:content-['']
            after:absolute
            after:top-[2px]
            after:left-[2px]
            after:bg-white
            after:border-gray-300
            after:border
            after:rounded-full
            after:h-4
            after:w-4
            after:transition-all
            after:duration-300
          `}
            ></div>
        </label>
    );
};

export default Switch;