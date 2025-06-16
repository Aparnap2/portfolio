import React from 'react';
import Image from 'next/image';

const OptimizedImage = ({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  quality = 85,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  ...props
}) => {
  // Handle different image formats
  const isSvg = src.endsWith('.svg');
  
  // Use a placeholder for better LCP
  const [isLoading, setIsLoading] = React.useState(true);
  
  // Generate blur data URL for placeholder
  const blurDataURL = `data:image/svg+xml;base64,${btoa(
    `<svg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}' viewBox='0 0 ${width} ${height}'><rect width='100%' height='100%' fill='#1f2937' opacity='0.2'/><text x='50%' y='50%' font-size='12' text-anchor='middle' fill='#9ca3af' dy='.3em'>Loading...</text></svg>`
  )}`;

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <Image
        src={src}
        alt={alt || ''}
        width={width}
        height={height}
        priority={priority}
        quality={isSvg ? 100 : quality}
        sizes={sizes}
        placeholder={isSvg ? 'empty' : 'blur'}
        blurDataURL={blurDataURL}
        className={`transition-opacity duration-300 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
        onLoadingComplete={() => setIsLoading(false)}
        loading={priority ? 'eager' : 'lazy'}
        {...props}
      />
      {isLoading && (
        <div 
          className="absolute inset-0 bg-gray-800 animate-pulse flex items-center justify-center"
          aria-hidden="true"
        >
          <div className="w-8 h-8 border-4 border-gray-600 border-t-purple-500 rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
};

export default React.memo(OptimizedImage);
