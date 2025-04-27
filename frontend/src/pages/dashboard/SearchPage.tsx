import React from 'react';
import { useLocation } from 'react-router-dom';
import { SearchForm } from '../../components/search/SearchForm';
import { SearchOptions } from '../../types/search';

interface LocationState {
  initialQuery?: string;
  initialNumResults?: number;
  initialSearchOptions?: SearchOptions;
}

const SearchPage: React.FC = () => {
  const location = useLocation();
  const { initialQuery, initialNumResults, initialSearchOptions } = (location.state as LocationState) || {};

  return (
    <div className="px-8 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Search Playground</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Test and experiment with different internet search configurations in real-time
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <SearchForm 
          initialQuery={initialQuery}
          initialNumResults={initialNumResults}
          initialSearchOptions={initialSearchOptions}
        />
      </div>
    </div>
  );
};

export default SearchPage;
