'use client';

import { useState, useRef, useEffect } from 'react';

interface ImageWithProgressProps {
  src: string;
  alt: string;
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export default function ImageWithProgress({ 
  src, 
  alt, 
  className = '', 
  onLoad, 
  onError 
}: ImageWithProgressProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const progressRef = useRef<number>(0);

  useEffect(() => {
    if (!src) return;

    setIsLoading(true);
    setProgress(0);
    setHasError(false);
    progressRef.current = 0;

    // Simulate progress for better UX
    const progressInterval = setInterval(() => {
      if (progressRef.current < 90) {
        progressRef.current += Math.random() * 15;
        setProgress(Math.min(progressRef.current, 90));
      }
    }, 100);

    const img = new Image();
    
    img.onload = () => {
      console.log('Image loaded successfully:', src.substring(0, 50) + '...');
      clearInterval(progressInterval);
      setProgress(100);
      setTimeout(() => {
        setIsLoading(false);
        onLoad?.();
      }, 200);
    };

    img.onerror = (error) => {
      console.error('Image failed to load:', src.substring(0, 50) + '...', error);
      clearInterval(progressInterval);
      setHasError(true);
      setIsLoading(false);
      onError?.();
    };

    console.log('Attempting to load image:', src.substring(0, 50) + '...');
    img.src = src;

    return () => {
      clearInterval(progressInterval);
    };
  }, [src, onLoad, onError]);

  if (hasError) {
    return (
      <div className={`bg-gray-200 flex items-center justify-center ${className}`}>
        <div className="text-gray-500 text-sm text-center p-4">
          <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          Failed to load image
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
          <div className="flex flex-col items-center justify-center">
            {/* Circular Progress Bar */}
            <div className="relative w-12 h-12">
              <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
                {/* Background circle */}
                <circle
                  cx="18"
                  cy="18"
                  r="16"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="4"
                />
                {/* Progress circle */}
                <circle
                  cx="18"
                  cy="18"
                  r="16"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={`${progress * 1.005} 100.5`}
                  className="transition-all duration-300 ease-out"
                />
              </svg>
              {/* Percentage text */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-medium text-gray-600">
                  {Math.round(progress)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
        onLoad={() => {
          if (imgRef.current?.complete) {
            setProgress(100);
            setTimeout(() => {
              setIsLoading(false);
              onLoad?.();
            }, 200);
          }
        }}
        onError={() => {
          setHasError(true);
          setIsLoading(false);
          onError?.();
        }}
      />
    </div>
  );
}
