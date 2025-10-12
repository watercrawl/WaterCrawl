import React, { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { LanguageIcon, CheckIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import { useDirection } from '../../contexts/DirectionContext';

interface Language {
  code: string;
  name: string;
  nativeName: string;
  direction: 'ltr' | 'rtl';
}

const languages: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English', direction: 'ltr' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', direction: 'ltr' },
  { code: 'fr', name: 'French', nativeName: 'Français', direction: 'ltr' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', direction: 'ltr' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', direction: 'ltr' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', direction: 'ltr' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', direction: 'ltr' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', direction: 'ltr' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', direction: 'rtl' },
  { code: 'fa', name: 'Persian', nativeName: 'فارسی', direction: 'rtl' },
];

export const LanguageSelector: React.FC = () => {
  const { i18n, t } = useTranslation();
  const { setDirection } = useDirection();

  const currentLanguage = languages.find((lang) => lang.code === i18n.language) || languages[0];

  const changeLanguage = async (languageCode: string) => {
    const selectedLang = languages.find((lang) => lang.code === languageCode);
    if (selectedLang) {
      await i18n.changeLanguage(languageCode);
      setDirection(selectedLang.direction);
      document.documentElement.lang = languageCode;
      document.documentElement.dir = selectedLang.direction;
    }
  };

  return (
    <Menu as="div" className="relative inline-block text-start">
      <Menu.Button className="inline-flex items-center gap-x-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
        <LanguageIcon className="h-5 w-5" />
        <span className="hidden sm:inline">{currentLanguage.nativeName}</span>
      </Menu.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute end-0 z-10 mt-2 w-56 origin-top-end rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1">
            <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                {t('dashboard.languages.selectLanguage')}
              </p>
            </div>
            {languages.map((language) => (
              <Menu.Item key={language.code}>
                {({ active }) => (
                  <button
                    onClick={() => changeLanguage(language.code)}
                    className={`${
                      active ? 'bg-gray-100 dark:bg-gray-700' : ''
                    } group flex w-full items-center justify-between px-4 py-2 text-sm text-gray-700 dark:text-gray-300 transition-colors`}
                  >
                    <span className="flex items-center gap-x-2">
                      <span>{language.nativeName}</span>
                      {language.name !== language.nativeName && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          ({language.name})
                        </span>
                      )}
                    </span>
                    {currentLanguage.code === language.code && (
                      <CheckIcon className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                    )}
                  </button>
                )}
              </Menu.Item>
            ))}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
};
