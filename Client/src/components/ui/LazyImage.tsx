import React from 'react';
import { useLazyImage } from '../../hooks/useLazyImage';
import { transformImageUrl } from '../../utils/cloudflareImageTransform';
import type { CloudflareImageTransformOptions } from '../../utils/cloudflareImageTransform';
import {
  CLOUDFLARE_ZONE,
  DEFAULT_IMAGE_OPTIONS,
} from '../../config/imageConfig';
import './LazyImage.css';

// Image variant interfaces (matching backend)
interface ImageVariants {
  thumbnail?: string; // 256px width WebP
  xsmall?: string; // 400px width WebP - Optimized for LCP
  small?: string; // 512px width WebP
  medium?: string; // 768px width WebP
  large?: string; // 1536px width WebP
}

interface ImageDimensions {
  original?: { width: number; height: number };
  thumbnail?: { width: number; height: number };
  xsmall?: { width: number; height: number }; // 400px - Optimized for LCP
  small?: { width: number; height: number };
  medium?: { width: number; height: number };
  large?: { width: number; height: number };
}

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
  /** Enable Cloudflare image transformations */
  enableTransform?: boolean;
  /** Cloudflare transformation options */
  transformOptions?: CloudflareImageTransformOptions;
  /** Width for responsive images (used with transform) */
  width?: number;
  /** Height for responsive images (reserves space to prevent CLS) */
  height?: number;
  /** Aspect ratio to maintain (e.g., "16/9", "4/3", "1/1") - prevents CLS */
  aspectRatio?: string;
  /** Sharp-generated WebP variants (from backend) */
  variants?: ImageVariants;
  /** Dimensions from backend for CLS prevention */
  dimensions?: ImageDimensions;
  /** Fetch priority hint for browser (use 'high' for LCP images) */
  fetchPriority?: 'high' | 'low' | 'auto';
  /** Responsive sizes hint for browser (affects which srcset variant loads) */
  sizes?: string;
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
  rootMargin = '100px',
  enableTransform = true,
  transformOptions,
  width,
  height,
  aspectRatio,
  variants,
  dimensions,
  fetchPriority = 'auto',
  sizes,
}) => {
  // Determine if we should use Sharp variants or Cloudflare transforms
  const hasVariants = variants && Object.keys(variants).length > 0;

  // Use variants if available, otherwise use Cloudflare transforms
  const shouldUseCloudflare =
    enableTransform && !hasVariants && CLOUDFLARE_ZONE;

  // Apply Cloudflare transformations only if no variants exist
  const finalSrc = React.useMemo(() => {
    if (shouldUseCloudflare && src) {
      // Merge default options with provided options and width
      const options: CloudflareImageTransformOptions = {
        ...DEFAULT_IMAGE_OPTIONS,
        ...transformOptions,
        ...(width && { width }),
      };
      return transformImageUrl(src, options, CLOUDFLARE_ZONE);
    }
    return src;
  }, [src, shouldUseCloudflare, transformOptions, width]);

  const { imageSrc, isLoaded, hasError, imgRef } = useLazyImage(finalSrc, {
    threshold,
    rootMargin,
    placeholder,
  });

  // Generate srcset from Sharp variants
  const srcSet = React.useMemo(() => {
    if (!hasVariants || !variants) return undefined;

    const srcsetParts: string[] = [];

    if (variants.thumbnail) {
      srcsetParts.push(`${variants.thumbnail} 256w`);
    }
    if (variants.xsmall) {
      srcsetParts.push(`${variants.xsmall} 400w`);
    }
    if (variants.small) {
      srcsetParts.push(`${variants.small} 512w`);
    }
    if (variants.medium) {
      srcsetParts.push(`${variants.medium} 768w`);
    }
    if (variants.large) {
      srcsetParts.push(`${variants.large} 1536w`);
    }

    return srcsetParts.length > 0 ? srcsetParts.join(', ') : undefined;
  }, [hasVariants, variants]);

  // Determine best variant source for main src (prefer xsmall/small for better quality)
  const bestSrc = React.useMemo(() => {
    if (hasVariants && variants) {
      return (
        variants.xsmall ||
        variants.small ||
        variants.medium ||
        variants.large ||
        variants.thumbnail ||
        imageSrc
      );
    }
    return imageSrc;
  }, [hasVariants, variants, imageSrc]);

  // Get dimensions for CLS prevention
  const imageDimensions = React.useMemo(() => {
    // Prioritize dimensions from database (prefer small/medium for actual display size)
    if (dimensions?.small) {
      return dimensions.small;
    }
    if (dimensions?.medium) {
      return dimensions.medium;
    }
    if (dimensions?.original) {
      return dimensions.original;
    }
    // Fallback to provided width/height
    if (width && height) {
      return { width, height };
    }
    return null;
  }, [dimensions, width, height]);

  // Calculate container style to prevent CLS
  const containerStyle = React.useMemo(() => {
    const style: React.CSSProperties = {};

    if (aspectRatio) {
      style.aspectRatio = aspectRatio;
    }

    if (width && !aspectRatio) {
      style.width = typeof width === 'number' ? `${width}px` : width;
    }

    if (height && !aspectRatio) {
      style.height = typeof height === 'number' ? `${height}px` : height;
    }

    return style;
  }, [width, height, aspectRatio]);

  return (
    <div
      className="relative w-full h-full min-h-[100px]"
      style={containerStyle}
    >
      {/* Only show image when it's loaded and no error */}
      {isLoaded && !hasError && (bestSrc || imageSrc) && (
        <img
          ref={imgRef}
          src={bestSrc || imageSrc}
          srcSet={srcSet}
          sizes={sizes || "(max-width: 640px) 256px, (max-width: 1024px) 400px, 512px"}
          alt={alt}
          width={imageDimensions?.width || width}
          height={imageDimensions?.height || height}
          className={`w-full h-full transition-all duration-500 opacity-100 blur-0 lazy-image-cover ${className}`}
          style={aspectRatio ? { aspectRatio } : undefined}
          loading={fetchPriority === 'high' ? 'eager' : 'lazy'}
          fetchPriority={fetchPriority}
        />
      )}

      {/* Show loading state when not loaded and not in error */}
      {!isLoaded && !hasError && (
        <div
          className={`w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 animate-pulse flex items-center justify-center ${loadingClassName}`}
        >
          <div ref={!isLoaded && !hasError ? imgRef : undefined}>
            {showSpinner && (
              <div
                className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
                style={{
                  borderColor: `${spinnerColor} transparent transparent transparent`,
                }}
              />
            )}
          </div>
        </div>
      )}

      {/* Show error state when there's an error */}
      {hasError && (
        <div
          className={`w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex flex-col items-center justify-center ${errorClassName}`}
        >
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
            <span className="text-xs text-gray-500 dark:text-gray-400 text-center">
              Image unavailable
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default LazyImage;
