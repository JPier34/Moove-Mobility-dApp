// City images configuration using Vercel Blob Storage
// These URLs will be replaced with actual Vercel Blob URLs after upload

export interface CityImageConfig {
  id: string;
  name: string;
  blobUrl: string;
  fallbackUrl: string;
  altText: string;
}

// Configuration with actual Vercel Blob URLs
export const CITY_IMAGES: Record<string, CityImageConfig> = {
  rome: {
    id: "rome",
    name: "Rome",
    blobUrl:
      "https://xsdctknbxfzpxukj.public.blob.vercel-storage.com/rome-hero.jpg",
    fallbackUrl: "/images/default-city.svg",
    altText: "Roma - Colosseo e monumenti storici",
  },
  sanbenedetto: {
    id: "sanbenedetto",
    name: "San Benedetto del Tronto",
    blobUrl:
      "https://xsdctknbxfzpxukj.public.blob.vercel-storage.com/san-benedetto-del-tronto-hero.jpg",
    fallbackUrl: "/images/default-city.svg",
    altText: "San Benedetto del Tronto - Vista mare e lungomare",
  },
};

/**
 * Get optimized city image URL with fallback
 */
export function getCityImageUrl(cityId: string): string {
  const cityImage = CITY_IMAGES[cityId];

  if (!cityImage) {
    return "/images/default-city.svg";
  }

  // Use Vercel Blob URL if available, otherwise fallback
  return cityImage.blobUrl || cityImage.fallbackUrl;
}

/**
 * Get city image configuration
 */
export function getCityImageConfig(cityId: string): CityImageConfig | null {
  return CITY_IMAGES[cityId] || null;
}

/**
 * Check if city has a custom image
 */
export function hasCityImage(cityId: string): boolean {
  return !!CITY_IMAGES[cityId];
}

/**
 * Get all city image configurations
 */
export function getAllCityImages(): CityImageConfig[] {
  return Object.values(CITY_IMAGES);
}

/**
 * Update city image URL after upload
 */
export function updateCityImageUrl(cityId: string, blobUrl: string): void {
  if (CITY_IMAGES[cityId]) {
    CITY_IMAGES[cityId].blobUrl = blobUrl;
  }
}

/**
 * Get current city image URLs for debugging
 */
export function getCurrentCityImageUrls(): Record<string, string> {
  const urls: Record<string, string> = {};
  Object.entries(CITY_IMAGES).forEach(([cityId, config]) => {
    urls[cityId] = config.blobUrl || config.fallbackUrl;
  });
  return urls;
}
