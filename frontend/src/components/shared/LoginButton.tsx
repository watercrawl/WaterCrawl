import React from "react";

interface LoginButtonProps {
    children: React.ReactNode;
    onClick: () => void;
}

export const LoginButton: React.FC<LoginButtonProps> = ({ children, onClick }) => {
    return (
        <button className="w-full flex items-center justify-center gap-x-2 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-primary-400 dark:focus:ring-offset-gray-800 transition-colors "
        onClick={onClick}
        >
            {children}
        </button>
    );
};