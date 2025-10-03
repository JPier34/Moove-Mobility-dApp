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

  // Multiple IPFS gateways for fallback
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

    // If it's not an IPFS URL, return as-is
    if (!originalSrc.includes("ipfs://")) {
      return originalSrc;
    }

    const cid = originalSrc.replace("ipfs://", "");

    // Use proxy server as primary solution for images
    if (currentGatewayIndex === 0) {
      return `/api/ipfs-proxy?hash=${encodeURIComponent(originalSrc)}`;
    }

    // Fallback to direct gateway access
    const currentGateway = ipfsGateways[currentGatewayIndex - 1]; // Adjust index since proxy is at 0
    return `${currentGateway}${cid}`;
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

    // If it's already a proxy URL, try fallback to direct gateway
    if (debouncedSrc.includes("/api/ipfs-proxy")) {
      console.log(
        `❌ Proxy server failed for: ${src}, trying direct gateway fallback`
      );

      // Extract the original IPFS hash from the proxy URL
      const urlParams = new URLSearchParams(debouncedSrc.split("?")[1]);
      const originalHash = urlParams.get("hash");

      if (originalHash && originalHash.includes("ipfs://")) {
        const ipfsHash = originalHash.replace("ipfs://", "");
        const directUrl = `https://ipfs.io/ipfs/${ipfsHash}`;
        console.log(`🔄 Trying direct gateway fallback: ${directUrl}`);
        setDebouncedSrc(directUrl);
        setCurrentGatewayIndex(0);
        setHasError(false);
        setIsLoaded(false);
        return;
      }

      // If we can't extract the hash, show placeholder
      console.log(`❌ Cannot extract IPFS hash, showing placeholder`);
      setHasError(true);
      setIsLoaded(false);
      return;
    }

    // Try next gateway if available (including proxy + direct gateways)
    const totalGateways = ipfsGateways.length + 1; // +1 for proxy server
    if (currentGatewayIndex < totalGateways - 1) {
      console.log(`🔄 Trying next gateway: ${currentGatewayIndex + 1}`);
      setCurrentGatewayIndex(currentGatewayIndex + 1);
      setHasError(false);
      setIsLoaded(false);
    } else {
      console.log(`❌ All gateways failed for: ${src}`);
      setHasError(true);
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
