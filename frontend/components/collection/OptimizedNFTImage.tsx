"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";

interface OptimizedNFTImageProps {
  src: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  fallbackIcon?: string;
  category?: string;
}

export default function OptimizedNFTImage({
  src,
  alt,
  className = "w-full h-full object-cover",
  containerClassName = "relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 overflow-hidden",
  fallbackIcon,
  category = "sticker",
}: OptimizedNFTImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [debouncedSrc, setDebouncedSrc] = useState<string>("");
  const [currentGatewayIndex, setCurrentGatewayIndex] = useState(0);
  const imgRef = useRef<HTMLImageElement>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Multiple IPFS gateways for fallback - Pinata first if available
  const ipfsGateways = [
    "https://gateway.pinata.cloud/ipfs/",
    "https://ipfs.io/ipfs/",
    "https://cloudflare-ipfs.com/ipfs/",
    "https://dweb.link/ipfs/",
  ];

  // Debounce src changes to prevent excessive API calls
  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      console.log(`🖼️ Loading NFT image: ${src}`);
      setDebouncedSrc(src);
      setCurrentGatewayIndex(0); // Reset to first gateway
      setIsLoaded(false);
      setHasError(false);
    }, 300); // 300ms debounce

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [src]);

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

  // Function to get the current gateway URL
  const getCurrentGatewayUrl = (originalSrc: string) => {
    if (!originalSrc) {
      return originalSrc;
    }

    // If it's already a proxy URL, return as-is
    if (originalSrc.includes("/api/ipfs-proxy")) {
      return originalSrc;
    }

    // Check if it's an IPFS hash (starts with Qm or bafy) without ipfs:// prefix
    const isIPFSHash = /^(Qm[a-zA-Z0-9]{44}|bafy[a-zA-Z0-9]{50,})/.test(originalSrc);
    
    // If it's not an IPFS URL or hash, return as-is
    if (!originalSrc.includes("ipfs://") && !isIPFSHash) {
      return originalSrc;
    }

    const cid = originalSrc.replace("ipfs://", "");

    // Try Pinata first (index 0), then other gateways
    if (currentGatewayIndex < ipfsGateways.length) {
      const currentGateway = ipfsGateways[currentGatewayIndex];
      return `${currentGateway}${cid}`;
    }

    // Fallback to proxy server as last resort
    return `/api/ipfs-proxy?hash=${encodeURIComponent(originalSrc)}`;
  };

  const handleLoad = () => {
    console.log(`✅ Image loaded successfully: ${debouncedSrc}`);
    setIsLoaded(true);
    setHasError(false);
  };

  const handleError = () => {
    console.log(
      `❌ Image failed to load: ${debouncedSrc} (gateway ${currentGatewayIndex})`
    );

    // Try next gateway if available
    if (currentGatewayIndex < ipfsGateways.length - 1) {
      console.log(`🔄 Trying next gateway: ${currentGatewayIndex + 1}`);
      setCurrentGatewayIndex(currentGatewayIndex + 1);
      setHasError(false);
      setIsLoaded(false);
    } else {
      // All direct gateways failed, try proxy as last resort
      console.log(`🔄 All direct gateways failed, trying proxy server...`);
      const proxyUrl = `/api/ipfs-proxy?hash=${encodeURIComponent(src)}`;
      setDebouncedSrc(proxyUrl);
      setCurrentGatewayIndex(ipfsGateways.length); // Set to proxy index
      setHasError(false);
      setIsLoaded(false);
    }
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
    <div ref={imgRef} className={containerClassName}>
      {isInView && (
        <>
          {!hasError &&
          debouncedSrc &&
          debouncedSrc !== "/images/default-nft.png" &&
          debouncedSrc !== "/images/default-nft.svg" ? (
            <img
              src={getCurrentGatewayUrl(debouncedSrc)}
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
          {(hasError ||
            !debouncedSrc ||
            debouncedSrc === "/images/default-nft.png" ||
            debouncedSrc === "/images/default-nft.svg") && (
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
