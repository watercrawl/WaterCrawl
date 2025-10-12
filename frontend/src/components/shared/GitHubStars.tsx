import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StarIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import axios from 'axios';

interface GitHubStarsProps {
  owner: string;
  repo: string;
  className?: string;
}

export const GitHubStars = ({ owner, repo, className = '' }: GitHubStarsProps) => {
  const { t } = useTranslation();
  const [stars, setStars] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStars = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(
          `https://api.github.com/repos/${owner}/${repo}`
        );
        setStars(response.data.stargazers_count);
      } catch (error) {
        console.error('Error fetching GitHub stars:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStars();
    // Set up a refresh interval - GitHub API has rate limits, so we refresh every 5 minutes
    const intervalId = setInterval(fetchStars, 5 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, [owner, repo]);

  const repoUrl = `https://github.com/${owner}/${repo}`;

  return (
    <div className={`overflow-hidden rounded-lg border border-blue-800/30 bg-blue-900/20 shadow-md hover:shadow-lg transition-shadow ${className}`}>
      <div className="px-4 py-3">
        <h3 className="text-sm font-medium text-blue-100 drop-shadow">{t('github.support')}</h3>
        <p className="mt-1 text-xs text-blue-300">
          {t('github.message')}
        </p>
      </div>
      <div className="flex items-center justify-between bg-blue-800/30 px-4 py-2">
        <div className="flex items-center gap-1">
          <StarSolidIcon className="h-4 w-4 text-yellow-400 drop-shadow-md" aria-hidden="true" />
          <span className="text-xs font-medium text-blue-200">
            {isLoading ? t('common.loading') : t('github.starsCount', { count: stars || 0 })}
          </span>
        </div>
        <a
          href={repoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 rounded-md bg-blue-800 px-2.5 py-1 text-xs font-medium text-blue-100 shadow-sm hover:bg-blue-700 hover:shadow transition-all"
          aria-label={`Star ${owner}/${repo} on GitHub`}
        >
          <StarIcon className="h-3.5 w-3.5" aria-hidden="true" />
          {t('github.star')}
        </a>
      </div>
    </div>
  );
};
