"use client";

import { motion } from "framer-motion";
import { getCityImageUrl, getCityImageConfig } from "@/utils/cityImages";
import { CityConfig } from "@/config/cities";

interface CityBackgroundImageProps {
  city: CityConfig | null;
  className?: string;
}

export default function CityBackgroundImage({
  city,
  className = "",
}: CityBackgroundImageProps) {
  const cityImageConfig = getCityImageConfig(city?.id || "");
  const imageUrl = getCityImageUrl(city?.id || "");

  // Debug temporaneo
  console.log("🔍 CityBackgroundImage Debug:", {
    cityId: city?.id,
    cityName: city?.name,
    hasImageConfig: !!cityImageConfig,
    imageUrl: imageUrl,
  });

  if (!cityImageConfig) {
    return (
      <div
        className={`bg-gradient-to-br from-blue-600 via-purple-600 to-green-600 ${className}`}
      >
        {/* Default gradient background */}
      </div>
    );
  }

  // Soluzione alternativa: componente semplice senza animazioni
  return (
    <div className={`relative ${className}`} style={{ zIndex: 1 }}>
      {/* Background Image - Semplice e diretto */}
      <div className="absolute inset-0">
        <img
          src={imageUrl}
          alt={cityImageConfig.altText}
          className="w-full h-full object-cover"
          style={{
            display: "block",
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
          onLoad={() => console.log("✅ Image loaded:", imageUrl)}
          onError={(e) => console.error("❌ Image failed:", imageUrl, e)}
        />
      </div>

      {/* Gradient Overlay - Molto trasparente */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/10 to-transparent" />

      {/* City Icon Overlay */}
      <div className="absolute top-8 right-8 text-6xl md:text-8xl opacity-20">
        {city?.heroImage?.icon || "🏙️"}
      </div>
    </div>
  );
}
