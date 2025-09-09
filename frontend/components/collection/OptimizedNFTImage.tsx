"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";

interface OptimizedNFTImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackIcon?: string;
  category?: string;
}

export default function OptimizedNFTImage({
  src,
  alt,
  className = "w-full h-full object-cover",
  fallbackIcon,
  category = "sticker",
}: OptimizedNFTImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleLoad = () => {
    setIsLoaded(true);
    setHasError(false);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(false);
  };

  const getFallbackIcon = () => {
    if (fallbackIcon) return fallbackIcon;

    switch (category) {
      case "sticker":
        return "🏷️";
      case "badge":
        return "🏆";
      case "skin":
        return "🎨";
      case "avatar":
        return "👤";
      default:
        return "🎨";
    }
  };

  return (
    <div
      ref={imgRef}
      className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 overflow-hidden"
    >
      {isInView && (
        <>
          {!hasError && src && src !== "/images/default-nft.png" ? (
            <img
              src={src}
              alt={alt}
              className={`${className} transition-opacity duration-300 ${
                isLoaded ? "opacity-100" : "opacity-0"
              }`}
              onLoad={handleLoad}
              onError={handleError}
              loading="lazy"
            />
          ) : null}

          {/* Loading skeleton */}
          {!isLoaded && !hasError && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-moove-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}

          {/* Fallback placeholder */}
          {(hasError || !src || src === "/images/default-nft.png") && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-32 h-32 bg-gradient-to-br from-white/20 to-white/5 rounded-2xl border border-white/20 flex items-center justify-center">
                <motion.div
                  className="text-4xl"
                  animate={{
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0],
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  {getFallbackIcon()}
                </motion.div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
