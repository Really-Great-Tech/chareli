import { useState, useRef, useEffect } from 'react';

interface UseLazyImageOptions {
  threshold?: number;
  rootMargin?: string;
  placeholder?: string;
}

export const useLazyImage = (
  src: string, 
  options: UseLazyImageOptions = {}
) => {
  const {
    threshold = 0.1,
    rootMargin = '100px',
    placeholder = ''
  } = options;

  const [imageSrc, setImageSrc] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        threshold,
        rootMargin
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  useEffect(() => {
    if (isInView) {
      // If no src provided, immediately set error state
      if (!src) {
        setImageSrc('');
        setIsLoaded(true);
        setHasError(true);
        return;
      }
      
      // If src is different from current imageSrc, load new image
      if (src !== imageSrc) {
        const img = new Image();
        
        img.onload = () => {
          setImageSrc(src);
          setIsLoaded(true);
          setHasError(false);
        };
        
        img.onerror = () => {
          setImageSrc('');
          setIsLoaded(true);
          setHasError(true);
        };
        
        img.src = src;
      }
    }
  }, [isInView, src, placeholder, imageSrc]);

  return { 
    imageSrc, 
    isLoaded, 
    isInView, 
    hasError, 
    imgRef 
  };
};
