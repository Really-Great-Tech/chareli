import { useState } from 'react';
import { SecureImage } from '../../../components/single/SecureImage';

interface GameThumbnailProps {
  src: string;
  alt: string;
}

export default function GameThumbnail({ src, alt }: GameThumbnailProps) {
  const [hasError, setHasError] = useState(false);

  const fallbackImage =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='3' width='18' height='18' rx='2' ry='2'%3E%3C/rect%3E%3Ccircle cx='8.5' cy='8.5' r='1.5'%3E%3C/circle%3E%3Cpolyline points='21 15 16 10 5 21'%3E%3C/polyline%3E%3C/svg%3E";

  return (
    <SecureImage
      src={hasError ? fallbackImage : src}
      alt={alt}
      className="w-12 h-12 rounded-lg object-cover bg-gray-100"
      onError={() => setHasError(true)}
    />
    // <img
    //   src={hasError ? fallbackImage : src}
    //   alt={alt}
    //   className="w-12 h-12 rounded-lg object-cover bg-gray-100"
    //   onError={() => setHasError(true)}
    // />
  );
}
