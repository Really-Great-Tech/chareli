import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiShare2 } from 'react-icons/fi';
import type { GameData } from '../../backend/types';
import { format } from 'date-fns';
import { trackGameplay } from '../../utils/analytics';

interface GameInfoSectionProps {
  game: GameData;
  likeCount: number;
}

export function GameInfoSection({ game, likeCount }: GameInfoSectionProps) {
  const { metadata, statistics } = game;
  const [shareStatus, setShareStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Handle share button click
  const handleShare = async () => {
    const shareData = {
      title: game.title,
      text: game.description || `Play ${game.title} on ArcadesBox`,
      url: window.location.href,
    };

    try {
      // Try Web Share API first (mobile/modern browsers)
      if (navigator.share) {
        await navigator.share(shareData);
        trackGameplay.gameShare(game.id, game.title, 'web_share');
        setShareStatus('success');
        setTimeout(() => setShareStatus('idle'), 3000);
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(window.location.href);
        trackGameplay.gameShare(game.id, game.title, 'clipboard');
        setShareStatus('success');
        setTimeout(() => setShareStatus('idle'), 3000);
      }
    } catch (error) {
      // Only set error if user didn't cancel
      if (error instanceof Error && error.name !== 'AbortError') {
        setShareStatus('error');
        setTimeout(() => setShareStatus('idle'), 3000);
      }
    }
  };

  // Format release date to "Month Year" format
  const releaseDate = format(new Date(game.createdAt), 'MMMM yyyy');

  // Get developer name from metadata, default to ArcadesBox
  const developerName = metadata?.developer || 'ArcadesBox';

  // Get total players for vote count
  const voteCount = statistics?.uniquePlayers || 0;

  return (
    <div className="space-y-8">
      {/* Game Title */}
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white font-dmmono">
        {game.title}
      </h1>

      {/* Game Details Link */}
      <a
        href="#game-details"
        className="text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300 text-sm font-worksans inline-block underline"
      >
        Game Details
      </a>

      {/* Metadata List */}
      <div className="space-y-3 text-sm">
        <div className="flex gap-2">
          <span className="text-gray-500 dark:text-gray-400 font-worksans">
            Developer:
          </span>
          <span className="text-gray-900 dark:text-white font-worksans">
            {developerName}
          </span>
        </div>
        <div className="flex gap-2">
          <span className="text-gray-500 dark:text-gray-400 font-worksans">
            Released:
          </span>
          <span className="text-gray-900 dark:text-white font-worksans">
            {releaseDate}
          </span>
        </div>
        <div className="flex gap-2">
          <span className="text-gray-500 dark:text-gray-400 font-worksans">
            Platform:
          </span>
          <span className="text-gray-900 dark:text-white font-worksans">
            Browser (desktop, mobile, tablet)
          </span>
        </div>
      </div>

      {/* Likes Display with Thumbs Up */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">👍</span>
          <span className="text-lg font-semibold text-gray-900 dark:text-white font-dmmono">
            {likeCount.toLocaleString()}
          </span>
        </div>
        <span className="text-sm text-gray-600 dark:text-gray-400 font-worksans">
          {voteCount.toLocaleString()} VOTES
        </span>
      </div>

      {/* Share Button */}
      <div className="relative">
        <button
          onClick={handleShare}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300 text-sm font-worksans"
        >
          <FiShare2 className="w-4 h-4" />
          {shareStatus === 'success' ? 'Copied!' : 'Share'}
        </button>
        {shareStatus === 'success' && (
          <div className="absolute top-full mt-2 left-0 bg-green-500 text-white px-3 py-1.5 rounded text-xs font-worksans whitespace-nowrap shadow-lg">
            ✓ Link copied to clipboard
          </div>
        )}
      </div>

      {/* Game Description */}
      {game.description && (
        <section id="game-details" className="space-y-3">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white font-dmmono">
            Game Description
          </h2>
          <div
            className="prose prose-sm dark:prose-invert max-w-none
              prose-headings:font-dmmono prose-p:font-worksans prose-li:font-worksans
              prose-ul:list-disc prose-ol:list-decimal prose-ul:ml-6 prose-ol:ml-6
              dark:prose-headings:text-white dark:prose-p:text-gray-300 dark:prose-li:text-gray-300"
            dangerouslySetInnerHTML={{ __html: game.description }}
          />
        </section>
      )}

      {/* How to Play */}
      {metadata?.howToPlay && (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white font-dmmono">
            How to Play
          </h2>
          <div
            className="prose prose-sm dark:prose-invert max-w-none
              prose-headings:font-dmmono prose-p:font-worksans prose-li:font-worksans
              prose-ul:list-disc prose-ol:list-decimal prose-ul:ml-6 prose-ol:ml-6
              dark:prose-headings:text-white dark:prose-p:text-gray-300 dark:prose-li:text-gray-300"
            dangerouslySetInnerHTML={{ __html: metadata.howToPlay }}
          />
        </section>
      )}

      {/* Tags - Clickable links to categories */}
      {metadata?.tags && metadata.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {metadata.tags.map((tag, index) => (
            <Link
              key={index}
              to={`/category/${encodeURIComponent(tag.toLowerCase())}`}
              className="px-2.5 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md text-xs font-medium font-worksans transition-colors"
            >
              {tag}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
