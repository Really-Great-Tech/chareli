import { useState, useEffect } from 'react';
import { backendService } from '../../backend/api.service';
import { Skeleton } from '../ui/skeleton'; // Or any loading spinner

interface SecureImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
}

export const SecureImage: React.FC<SecureImageProps> = ({ src, ...props }) => {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchImage = async () => {
      if (!src) return;
      setIsLoading(true);
      try {
        const response = await backendService.get(src, {
          responseType: 'blob',
        });
        if (isMounted) {
          const url = URL.createObjectURL(response as any);
          setObjectUrl(url);
        }
      } catch (error) {
        console.error('Failed to load secure image:', src, error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchImage();

    return () => {
      isMounted = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [src]);

  if (isLoading) {
    return <Skeleton className={props.className} />;
  }

  if (!objectUrl) {
    // Render a fallback or placeholder
    return <div className={props.className + ' bg-gray-200'}></div>;
  }

  return <img src={objectUrl} {...props} />;
};
