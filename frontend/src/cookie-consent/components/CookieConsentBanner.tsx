import { useState } from "react";
import { useCookieConsent } from "../contexts/CookieConsentContext";
import { CheckCircle, Cookie, Settings } from "lucide-react";
import CookieConsentModal from "./CookieConsentModal";

export const CookieConsentBanner: React.FC = () => {
    const { isConsentGiven, updateConsent, categories, isClient } = useCookieConsent();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleAcceptAll = () => {
        const allNonEssentialCategories = categories
            .filter(cat => !cat.essential)
            .map(cat => cat.id);

        updateConsent(allNonEssentialCategories);
    };

    if (!isClient || isConsentGiven) return null;

    return (
        <>
            {!isModalOpen && <div
                className={'fixed bottom-4 left-4 right-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-0 sm:justify-between p-4 rounded-lg shadow-lg transition-all duration-300 ease-in-out bg-white dark:bg-gray-800 text-black dark:text-white border border-gray-200 dark:border-gray-700 z-[100]'}
            >
                <div className="flex items-center space-x-4 w-full sm:w-auto">
                    <Cookie className="w-6 h-6 text-blue-500 shrink-0" />
                    <p className="text-sm font-medium">
                        This website uses cookies to enhance your experience.
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="w-full sm:w-auto px-4 py-2 rounded-md flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white dark:bg-blue-700 dark:hover:bg-blue-600 text-sm font-medium transition-colors whitespace-nowrap"
                    >
                        <Settings className="w-4 h-4 mr-2 shrink-0" />
                        Manage Cookies
                    </button>
                    <button
                        onClick={handleAcceptAll}
                        className="w-full sm:w-auto px-4 py-2 rounded-md flex items-center justify-center bg-green-500 hover:bg-green-600 text-white dark:bg-green-700 dark:hover:bg-green-600 text-sm font-medium transition-colors whitespace-nowrap"
                    >
                        <CheckCircle className="w-4 h-4 mr-2 shrink-0" />
                        Accept All
                    </button>
                </div>
            </div>
            }

            {isModalOpen && (
                <CookieConsentModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                />
            )}
        </>
    );
};

export default CookieConsentBanner;