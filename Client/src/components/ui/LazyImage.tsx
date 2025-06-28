import React from 'react';
import { useLazyImage } from '../../hooks/useLazyImage';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
  loadingClassName?: string;
  errorClassName?: string;
  showSpinner?: boolean;
  spinnerColor?: string;
  threshold?: number;
  rootMargin?: string;
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className = '',
  placeholder = '',
  loadingClassName = '',
  errorClassName = '',
  showSpinner = true,
  spinnerColor = '#D946EF',
  threshold = 0.1,
  rootMargin = '100px'
}) => {
  const { imageSrc, isLoaded, hasError, imgRef } = useLazyImage(src, {
    threshold,
    rootMargin,
    placeholder
  });

  return (
    <div className="relative w-full h-full min-h-[100px]">
      {/* Only show image when it's loaded and no error */}
      {isLoaded && !hasError && imageSrc && (
        <img
          ref={imgRef}
          src={imageSrc}
          alt={alt}
          className={`w-full h-full transition-all duration-500 opacity-100 blur-0 ${className}`}
        />
      )}
      
      {/* Show loading state when not loaded and not in error */}
      {!isLoaded && !hasError && (
        <div className={`w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 animate-pulse flex items-center justify-center ${loadingClassName}`}>
          <div ref={!isLoaded && !hasError ? imgRef : undefined}>
            {showSpinner && (
              <div 
                className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
                style={{ 
                  borderColor: `${spinnerColor} transparent transparent transparent` 
                }}
              />
            )}
          </div>
        </div>
      )}
      
      {/* Show error state when there's an error */}
      {hasError && (
        <div className={`w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex flex-col items-center justify-center ${errorClassName}`}>
          <div ref={hasError ? imgRef : undefined}>
            <div className="w-12 h-12 mb-2 rounded-lg bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
              <svg 
                className="w-6 h-6 text-gray-500 dark:text-gray-400" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2z" 
                />
              </svg>
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400 text-center">Image unavailable</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default LazyImage;
