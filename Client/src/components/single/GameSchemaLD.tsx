import { useEffect } from 'react';
import type { GameData } from '../../backend/types';

interface GameSchemaLDProps {
  game: GameData;
  likeCount: number;
}

export function GameSchemaLD({ game, likeCount }: GameSchemaLDProps) {
  useEffect(() => {
    // Calculate rating value from likes (scale to 3-5 stars)
    const ratingValue = Math.min(5, likeCount / 50 + 3);

    const schemaData = {
      '@context': 'https://schema.org',
      '@type': 'VideoGame',
      name: game.title,
      description:
        game.description ||
        game.metadata?.howToPlay ||
        'Play this exciting game!',
      image: game.thumbnailFile?.s3Key,
      genre: game.category?.name,
      datePublished: game.createdAt,
      dateModified: game.updatedAt,
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: ratingValue.toFixed(1),
        reviewCount: likeCount,
        bestRating: '5',
        worstRating: '1',
      },
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
    };

    // Create script element
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(schemaData);
    script.id = 'game-schema-ld';

    // Remove existing schema if present
    const existingScript = document.getElementById('game-schema-ld');
    if (existingScript) {
      existingScript.remove();
    }

    // Add new schema to head
    document.head.appendChild(script);

    // Cleanup on unmount
    return () => {
      const scriptToRemove = document.getElementById('game-schema-ld');
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [game, likeCount]);

  return null; // This component doesn't render anything visible
}
