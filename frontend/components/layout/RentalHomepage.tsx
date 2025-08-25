"use client";

import React, { useState, useEffect } from "react";
import { EUROPEAN_CITIES } from "@/config/cities";
import { motion } from "framer-motion";
import { VehicleGeolocationSystem } from "@/utils/vehicleGeoLocation";
import LocationPermissionModal from "@/components/modals/LocationPermissionModal";
import type {
  LocationCoordinates,
  NearbyVehicle,
} from "@/utils/vehicleGeoLocation";
import { usePreloadCityImages } from "@/hooks/useIPFSImage";
import StatsSection from "@/components/sections/StatsSection";
import VehicleSection, {
  VehicleOption,
} from "@/components/sections/VehicleSection";
import NFTMarketplaceSection from "@/components/sections/NFTMarketplaceSection";
import HowItWorksSection from "@/components/sections/HowItWorksSection";

// ============= TYPES =============

interface LocationState {
  currentCity: any | null;
  isLoading: boolean;
  error: string | null;
  canRent: boolean;
  nearbyVehicles: NearbyVehicle[];
  location: LocationCoordinates | null;
  showLocationModal: boolean;
  locationMethod: "gps" | "manual" | "none";
}

// ============= ICONS =============

// SVGs custom
const ElectricIconMinimal = ({ className = "w-6 h-6" }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
  >
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
  </svg>
);

const NFTIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12,1L21,5V11C21,16.55 17.16,21.74 12,23C6.84,21.74 3,16.55 3,11V5L12,1M12,7A2,2 0 0,0 10,9A2,2 0 0,0 12,11A2,2 0 0,0 14,9A2,2 0 0,0 12,7M12,14C10.67,14 8,14.67 8,16V18H16V16C16,14.67 13.33,14 12,14Z" />
  </svg>
);

const GlobalIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M16.36,14C16.44,13.34 16.5,12.68 16.5,12C16.5,11.32 16.44,10.66 16.36,10H19.74C19.9,10.64 20,11.31 20,12C20,12.69 19.9,13.36 19.74,14M14.59,19.56C15.19,18.45 15.65,17.25 15.97,16H18.92C17.96,17.65 16.43,18.93 14.59,19.56M14.34,14H9.66C9.56,13.34 9.5,12.68 9.5,12C9.5,11.32 9.56,10.65 9.66,10H14.34C14.43,10.65 14.5,11.32 14.5,12C14.5,12.68 14.43,13.34 14.34,14M12,19.96C11.17,18.76 10.5,17.43 10.09,16H13.91C13.5,17.43 12.83,18.76 12,19.96M8,8H5.08C6.03,6.34 7.57,5.06 9.4,4.44C8.8,5.55 8.35,6.75 8,8M5.08,16H8C8.35,17.25 8.8,18.45 9.4,19.56C7.57,18.93 6.03,17.65 5.08,16M4.26,14C4.1,13.36 4,12.69 4,12C4,11.31 4.1,10.64 4.26,10H7.64C7.56,10.66 7.5,11.32 7.5,12C7.5,12.68 7.56,13.34 7.64,14M12,4.03C12.83,5.23 13.5,6.57 13.91,8H10.09C10.5,6.57 11.17,5.23 12,4.03M18.92,8H15.97C15.65,6.75 15.19,5.55 14.59,4.44C16.43,5.07 17.96,6.34 18.92,8M12,2C6.47,2 2,6.5 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" />
  </svg>
);

// ============= HOOKS =============
function useLocationWithModal(): [
  LocationState,
  {
    handleLocationGranted: (location: LocationCoordinates) => void;
    handleLocationDenied: () => void;
    handleManualCitySelect: (cityId: string) => void;
    requestLocationAgain: () => void;
  }
] {
  const [locationState, setLocationState] = useState<LocationState>({
    currentCity: null,
    isLoading: false,
    error: null,
    canRent: false,
    nearbyVehicles: [],
    location: null,
    showLocationModal: true,
    locationMethod: "none",
  });

  useEffect(() => {
    const checkExistingPermission = async (): Promise<void> => {
      try {
        const geoSystem = new VehicleGeolocationSystem();
        let permission: "granted" | "denied" | "prompt" = "prompt";

        if (navigator.permissions) {
          try {
            const permissionStatus = await navigator.permissions.query({
              name: "geolocation" as PermissionName,
            });
            permission = permissionStatus.state as
              | "granted"
              | "denied"
              | "prompt";
          } catch (error) {
            console.warn("Could not check location permission:", error);
            permission = "prompt";
          }
        }

        if (permission === "granted") {
          try {
            const location = await geoSystem.getCurrentLocation();
            handleLocationGranted(location);
            setLocationState((prev) => ({ ...prev, showLocationModal: false }));
          } catch (error) {
            setLocationState((prev) => ({ ...prev, showLocationModal: true }));
          }
        } else {
          setLocationState((prev) => ({ ...prev, showLocationModal: true }));
        }
      } catch (error) {
        setLocationState((prev) => ({ ...prev, showLocationModal: true }));
      }
    };

    checkExistingPermission();
  }, []);

  const handleLocationGranted = async (location: LocationCoordinates) => {
    setLocationState((prev) => ({
      ...prev,
      isLoading: true,
      showLocationModal: false,
      locationMethod: "gps",
    }));

    try {
      const geoSystem = new VehicleGeolocationSystem();
      const cityCheck = geoSystem.checkCitySupport(location);

      let currentCity = null;
      let canRent = false;
      let nearbyVehicles: NearbyVehicle[] = [];

      if (cityCheck.inCity && cityCheck.cityName) {
        currentCity = EUROPEAN_CITIES.find(
          (city) => city.id === cityCheck.cityName
        );
        canRent = true;

        try {
          nearbyVehicles = await geoSystem.getNearbyVehicles(location, 2);
        } catch (error) {
          console.warn("Could not fetch nearby vehicles:", error);
        }
      }

      setLocationState((prev) => ({
        ...prev,
        currentCity,
        location,
        canRent,
        nearbyVehicles,
        isLoading: false,
        error: null,
      }));
    } catch (error: any) {
      setLocationState((prev) => ({
        ...prev,
        isLoading: false,
        error: error.message || "Failed to process location",
      }));
    }
  };

  const handleLocationDenied = () => {
    setLocationState((prev) => ({
      ...prev,
      showLocationModal: false,
      locationMethod: "none",
      error: "Location access denied",
    }));
  };

  const handleManualCitySelect = (cityId: string) => {
    const selectedCity = EUROPEAN_CITIES.find((city) => city.id === cityId);

    if (selectedCity) {
      setLocationState((prev) => ({
        ...prev,
        currentCity: selectedCity,
        canRent: true,
        showLocationModal: false,
        locationMethod: "manual",
        location: selectedCity.coordinates,
        nearbyVehicles: [],
        error: null,
      }));
    }
  };

  const requestLocationAgain = () => {
    setLocationState((prev) => ({
      ...prev,
      showLocationModal: true,
      error: null,
    }));
  };

  return [
    locationState,
    {
      handleLocationGranted,
      handleLocationDenied,
      handleManualCitySelect,
      requestLocationAgain,
    },
  ];
}

// ============= COMPONENTS =============
function HeroContent({
  locationState,
  requestLocationAgain,
}: {
  locationState: LocationState;
  requestLocationAgain: () => void;
  onRentVehicle: (vehicle: VehicleOption) => void;
}) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: { clientX: number; clientY: number }) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <motion.div
      className="space-y-8 md:space-y-12 relative"
      initial={{ opacity: 0, x: -100 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8 }}
    >
      {/* Interactive background grid */}
      <div className="absolute inset-0 opacity-10 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-24 h-24 border border-white/30 rounded-lg"
            style={{
              left: `${(i % 3) * 30 + 10}%`,
              top: `${Math.floor(i / 3) * 40 + 20}%`,
            }}
            animate={{
              rotate: mousePosition.x * 0.05 + i * 15,
              scale: 1 + Math.sin(Date.now() * 0.002 + i) * 0.1,
              opacity: [0.1, 0.3],
            }}
            transition={{
              type: "spring",
              stiffness: 50,
              opacity: { duration: 3, repeat: Infinity, delay: i * 0.5 },
            }}
          />
        ))}
      </div>

      {/* Title */}
      <div className="space-y-2 relative z-10 pt-20 md:pt-8">
        <motion.div
          className="text-3xl md:text-6xl font-bold text-white/90"
          initial={{ clipPath: "polygon(0 0, 0 0, 0 100%, 0% 100%)" }}
          animate={{ clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)" }}
          transition={{ duration: 1.5, delay: 0.5 }}
        >
          Welcome to
        </motion.div>

        <div className="relative">
          <motion.div
            className="text-6xl md:text-9xl font-black leading-none text-white"
            initial={{ clipPath: "polygon(0 0, 0 0, 0 100%, 0% 100%)" }}
            animate={{ clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)" }}
            transition={{ duration: 1.5, delay: 0.7 }}
            style={{
              filter: `hue-rotate(${mousePosition.x * 0.5}deg)`,
            }}
          >
            mOO
          </motion.div>
          <motion.div
            className="text-6xl md:text-9xl font-black leading-none bg-gradient-to-r from-green-400 via-blue-400 to-purple-500 bg-clip-text text-transparent ml-4 md:ml-8 lg:ml-12"
            initial={{
              clipPath: "polygon(100% 0, 100% 0, 100% 100%, 100% 100%)",
            }}
            animate={{ clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)" }}
            transition={{ duration: 1.5, delay: 1.0 }}
            style={{
              backgroundSize: "200%",
            }}
          >
            <motion.span
              animate={{
                backgroundPosition: ["0%", "100%", "0%"],
              }}
              transition={{ duration: 5, repeat: Infinity }}
            >
              ve
            </motion.span>
          </motion.div>
        </div>
      </div>

      {/* Description */}
      <motion.p
        className="text-lg md:text-xl leading-relaxed text-white/90 max-w-xl relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 1.3 }}
      >
        The future of urban mobility is here. <br /> Rent electric vehicles with
        <br />
        <motion.span
          className="font-semibold bg-gradient-to-r from-green-400 to-white bg-clip-text text-transparent"
          animate={{
            backgroundPosition: ["0%", "100%", "0%"],
          }}
          transition={{ duration: 3, repeat: Infinity }}
          style={{ backgroundSize: "200%" }}
        >
          blockchain-powered NFT passes
        </motion.span>
        .
      </motion.p>

      {/* Features */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-3 gap-4 relative z-10 px-2 sm:px-0"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 1.5 }}
      >
        {[
          {
            icon: ElectricIconMinimal,
            title: "Electric",
            desc: "Zero emissions",
            gradient: "from-yellow-400 to-orange-500",
          },
          {
            icon: NFTIcon,
            title: "NFT Passes",
            desc: "Own your mobility",
            gradient: "from-purple-400 to-pink-500",
          },
          {
            icon: GlobalIcon,
            title: "Global",
            desc: "Expanding cities",
            gradient: "from-green-400 to-blue-500",
          },
        ].map((feature, i) => (
          <motion.div
            key={i}
            className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:border-white/20 transition-all group"
            whileHover={{
              scale: 1.05,
              backgroundColor: "rgba(255,255,255,0.1)",
              y: -5,
            }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            animate={{
              y: [0, -2],
            }}
            style={{
              animationDelay: `${i * 0.2}s`,
            }}
          >
            <motion.div
              className="text-white mb-3 w-8 h-8 flex items-center justify-center"
              animate={{
                rotate: [0, 5, -5, 0],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                delay: i * 0.7,
                ease: "easeInOut",
              }}
            >
              <feature.icon className="w-8 h-8" />
            </motion.div>

            <div className="font-semibold text-sm text-white group-hover:text-white transition-colors">
              {feature.title}
            </div>
            <div className="text-xs text-white/70 group-hover:text-white/90 transition-colors">
              {feature.desc}
            </div>

            <motion.div
              className={`h-0.5 bg-gradient-to-r ${feature.gradient} mt-2 opacity-0 group-hover:opacity-100 transition-opacity`}
              initial={{ width: 0 }}
              whileHover={{ width: "100%" }}
              transition={{ duration: 0.3 }}
            />
          </motion.div>
        ))}
      </motion.div>

      {/* Location Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 1.7 }}
        className="relative z-10"
      >
        <div className="relative group">
          <LocationStatusBanner
            locationState={locationState}
            onRequestLocation={requestLocationAgain}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}

function LocationStatusBanner({
  locationState,
  onRequestLocation,
}: {
  locationState: LocationState;
  onRequestLocation: () => void;
}) {
  const {
    currentCity,
    isLoading,
    error,
    canRent,
    nearbyVehicles,
    locationMethod,
  } = locationState;

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="inline-flex items-center bg-blue-500/10 backdrop-blur-sm border border-blue-500/20 text-blue-200 px-6 py-3 rounded-full text-lg font-medium"
      >
        <motion.div
          className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full mr-3"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        Processing your location...
      </motion.div>
    );
  }

  if (canRent && currentCity) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="inline-flex items-center bg-green-500/10 backdrop-blur-sm border border-green-500/20 text-green-200 px-6 py-4 mt-0 mb-6 rounded-full text-lg font-medium"
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        <span className="text-2xl mr-3">
          {locationMethod === "gps" ? "📍" : "🏙️"}
        </span>
        <div className="text-left">
          <div>Service available in {currentCity.name}</div>
          <div className="text-sm opacity-75">
            {locationMethod === "gps"
              ? `${nearbyVehicles.length} vehicles nearby`
              : "Manual city selection"}
          </div>
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="inline-flex items-center bg-yellow-500/10 backdrop-blur-sm border border-yellow-500/20 text-yellow-200 px-6 py-3 rounded-full text-lg font-medium"
      >
        <span className="text-2xl mr-3">⚠️</span>
        <div className="text-left">
          <div>Location not available</div>
          <div className="text-sm opacity-75">
            <button
              onClick={onRequestLocation}
              className="underline hover:no-underline transition-all"
            >
              Click here to set location
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="inline-flex items-center bg-white/10 backdrop-blur-sm border border-white/20 text-white px-6 py-3 rounded-full text-lg font-medium"
    >
      <span className="text-2xl mr-3">🌍</span>
      <div className="text-left">
        <div>Now Available in {EUROPEAN_CITIES.length} European cities</div>
      </div>
    </motion.div>
  );
}

export default function RentalHomepage() {
  const [
    locationState,
    {
      handleLocationGranted,
      handleLocationDenied,
      handleManualCitySelect,
      requestLocationAgain,
    },
  ] = useLocationWithModal();

  const { preloadAllCityImages } = usePreloadCityImages();

  useEffect(() => {
    preloadAllCityImages();
  }, [preloadAllCityImages]);

  const handleRentVehicle = (vehicle: VehicleOption) => {
    if (locationState.canRent) {
      const cityParam = locationState.currentCity?.id
        ? `&city=${locationState.currentCity.id}`
        : "";
      window.location.href = `/marketplace?vehicle=${vehicle.type}${cityParam}`;
    } else {
      window.location.href = "/marketplace";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <LocationPermissionModal
        isOpen={locationState.showLocationModal}
        onLocationGranted={handleLocationGranted}
        onLocationDenied={handleLocationDenied}
        onManualCitySelect={handleManualCitySelect}
      />

      <section className="relative h-fit flex items-center text-white overflow-hidden">
        <div className="absolute inset-0">
          <motion.div
            className="absolute inset-0"
            animate={{
              background: [
                "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                "linear-gradient(135deg, #764ba2 0%, #667eea 100%)",
                "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              ],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />

          {locationState.currentCity && (
            <motion.div
              className="absolute right-0 top-0 w-full lg:w-1/2 h-full hidden lg:block"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              style={{ zIndex: 1 }}
            >
              <div
                className="w-full h-full relative"
                style={{
                  backgroundImage:
                    locationState.currentCity?.id === "sanbenedetto"
                      ? 'url("https://xsdctknbxfzpxukj.public.blob.vercel-storage.com/san-benedetto-del-tronto-hero.jpg")'
                      : locationState.currentCity?.id === "rome"
                      ? 'url("https://xsdctknbxfzpxukj.public.blob.vercel-storage.com/rome-hero.jpg")'
                      : "none",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  backgroundRepeat: "no-repeat",
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-l from-black/40 via-transparent to-black/60 lg:to-transparent" />
              </div>
            </motion.div>
          )}

          <div
            className="absolute inset-0 overflow-hidden pointer-events-none"
            style={{ zIndex: 2 }}
          >
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-white/40 rounded-full"
                initial={{
                  x:
                    typeof window !== "undefined"
                      ? Math.random() * window.innerWidth
                      : 0,
                  y:
                    typeof window !== "undefined"
                      ? Math.random() * window.innerHeight
                      : 0,
                  opacity: 0,
                }}
                animate={{
                  x:
                    typeof window !== "undefined"
                      ? Math.random() * window.innerWidth
                      : 0,
                  y:
                    typeof window !== "undefined"
                      ? Math.random() * window.innerHeight
                      : 0,
                  opacity: [0, 1],
                }}
                transition={{
                  duration: 4 + Math.random() * 3,
                  repeat: Infinity,
                  delay: Math.random() * 3,
                }}
              />
            ))}
          </div>
        </div>

        <div
          className="relative max-w-7xl mr-auto px-4 sm:px-6 w-full min-h-screen"
          style={{ zIndex: 10 }}
        >
          <div className="grid grid-cols-12 gap-8 items-center min-h-[70vh] md:min-h-[80vh]">
            <div className="col-span-12 lg:col-span-8">
              <HeroContent
                locationState={locationState}
                requestLocationAgain={requestLocationAgain}
                onRentVehicle={handleRentVehicle}
              />
            </div>
            <div className="hidden lg:block lg:col-span-4" />
          </div>
        </div>
      </section>

      <StatsSection />
      <VehicleSection
        locationState={locationState}
        onRentVehicle={handleRentVehicle}
      />
      <NFTMarketplaceSection />
      <HowItWorksSection />
    </div>
  );
}
