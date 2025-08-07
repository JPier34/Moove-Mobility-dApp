import { VehicleType } from "@/config/cities";
import { EUROPEAN_CITIES } from "@/config/cities";
import { CityConfig } from "@/config/cities";

// ============= TYPES (keep existing interfaces for compatibility) =============
export interface LocationCoordinates {
  lat: number;
  lng: number;
}

export interface CitySupport {
  inCity: boolean;
  cityName?: string;
  distance?: number;
  nearestCity?: string;
}

export interface NearbyVehicle {
  vehicleId: string;
  vehicleType: VehicleType;
  location: LocationCoordinates;
  distance: number;
  batteryLevel: number;
  estimatedRange: number;
  isAvailable: boolean;
  lastUpdate: Date;
  cityId: string;
}

// New simplified state interface
interface LocationStateResult {
  currentCity: any | null; // Preferred city (manually selected or detected)
  detectedCity: any | null; // Detected city from GPS/IP
  isLoading: boolean;
  error: string | null;
  canRent: boolean;
  lastUpdated: number;
  method: "gps" | "manual" | "cached" | "ip";
  preferredCityMethod: "manual" | "detected" | "none"; // How the preferred city was set
}

// Vehicle location interface (for fleet management)
interface VehicleLocation {
  vehicleId: string;
  vehicleType: VehicleType;
  cityId: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  batteryLevel: number;
  isAvailable: boolean;
  lastUpdate: Date;
  estimatedRange: number;
}

// ============= CONSTANTS =============
const GEOLOCATION_OPTIONS: PositionOptions = {
  enableHighAccuracy: false, // Less resource intensive
  timeout: 10000, // 10 seconds
  maximumAge: 300000, // 5 minutes cache
};

const STORAGE_KEY = "moove_city_location";
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

export class VehicleGeolocationSystem {
  private static instance: VehicleGeolocationSystem;
  private vehicleLocations: Map<string, VehicleLocation> = new Map();

  static getInstance(): VehicleGeolocationSystem {
    if (!VehicleGeolocationSystem.instance) {
      VehicleGeolocationSystem.instance = new VehicleGeolocationSystem();
      VehicleGeolocationSystem.instance.initializeVehicleFleet();
    }
    return VehicleGeolocationSystem.instance;
  }

  constructor() {
    if (!this.vehicleLocations.size) {
      this.initializeVehicleFleet();
    }
  }

  // ============= PERSISTENT LOCATION MANAGEMENT =============

  private saveLocationToStorage(state: LocationStateResult): void {
    try {
      if (typeof window !== "undefined") {
        // Save to localStorage for persistence across sessions
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        // Also save to sessionStorage for immediate access
        if (window.sessionStorage) {
          sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        }
      }
    } catch (error) {
      console.warn("Failed to save location:", error);
    }
  }

  private loadLocationFromStorage(): LocationStateResult | null {
    try {
      if (typeof window === "undefined") {
        return null;
      }

      // Try localStorage first (persistent)
      let stored = localStorage.getItem(STORAGE_KEY);
      let storageType = "localStorage";

      // Fallback to sessionStorage if localStorage is empty
      if (!stored && window.sessionStorage) {
        stored = sessionStorage.getItem(STORAGE_KEY);
        storageType = "sessionStorage";
      }

      if (!stored) return null;

      const data = JSON.parse(stored) as LocationStateResult;
      const now = Date.now();

      console.log(`📍 Loading location from ${storageType}:`, {
        city: data.currentCity?.name,
        method: data.method,
        preferredMethod: data.preferredCityMethod,
        lastUpdated: new Date(data.lastUpdated).toLocaleTimeString(),
      });

      // For manual selections, don't expire the cache
      if (data.preferredCityMethod === "manual") {
        console.log("🎯 Manual city selection found - keeping persistent");
        return data;
      }

      // Check if cache is still valid for detected cities
      if (now - data.lastUpdated > CACHE_DURATION) {
        console.log("⏰ Location cache expired, clearing...");
        localStorage.removeItem(STORAGE_KEY);
        if (window.sessionStorage) {
          sessionStorage.removeItem(STORAGE_KEY);
        }
        return null;
      }

      return data;
    } catch (error) {
      console.warn("Failed to load location:", error);
      return null;
    }
  }

  // ============= MAIN LOCATION METHODS =============

  /**
   * Get current user location with caching
   */
  async getCurrentLocation(): Promise<LocationCoordinates> {
    // Get fresh location - don't use cache for GPS coordinates
    if (!navigator.geolocation) {
      throw new Error("Geolocation is not supported by this browser");
    }

    return new Promise<LocationCoordinates>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coordinates: LocationCoordinates = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };

          console.log("🌍 Fresh GPS coordinates received:", coordinates);

          resolve(coordinates);
        },
        (error) => {
          let message: string;
          switch (error.code) {
            case error.PERMISSION_DENIED:
              message =
                "Location access denied. Please enable location services.";
              break;
            case error.POSITION_UNAVAILABLE:
              message = "Location information unavailable.";
              break;
            case error.TIMEOUT:
              message = "Location request timed out.";
              break;
            default:
              message = "Unknown location error.";
          }
          reject(new Error(message));
        },
        GEOLOCATION_OPTIONS
      );
    });
  }

  /**
   * Get current location state
   */

  private saveLocationState(
    coordinates: LocationCoordinates,
    nearestCity: any | null,
    method: "gps" | "manual" | "cached" | "ip" = "gps",
    error: string | null = null,
    detectedCity: any | null = null,
    preferredCityMethod: "manual" | "detected" | "none" = "detected"
  ): LocationStateResult {
    const state: LocationStateResult = {
      currentCity: nearestCity,
      detectedCity: detectedCity || nearestCity,
      isLoading: false,
      error: error,
      canRent: !!nearestCity, // Can rent if we have any city (even fallback)
      lastUpdated: Date.now(),
      method: method,
      preferredCityMethod: preferredCityMethod,
    };

    this.saveLocationToStorage(state);
    return state;
  }

  findNearestSupportedCity(coordinates: LocationCoordinates): any | null {
    let nearestCity = null;
    let minDistance = Infinity;
    const distances: { city: string; distance: number }[] = [];

    console.log(
      `📍 Finding nearest city for coordinates: ${coordinates.lat}, ${coordinates.lng}`
    );

    for (const city of EUROPEAN_CITIES) {
      const { bounds } = city;

      // Check if inside city bounds first
      if (
        coordinates.lat >= bounds.south &&
        coordinates.lat <= bounds.north &&
        coordinates.lng >= bounds.west &&
        coordinates.lng <= bounds.east
      ) {
        console.log(`✅ Inside ${city.name} bounds - returning immediately`);
        return city; // Inside city, return immediately
      }

      // Calculate distance to city center
      const distance = this.calculateDistance(
        coordinates.lat,
        coordinates.lng,
        city.coordinates.lat,
        city.coordinates.lng
      );

      distances.push({ city: city.name, distance });

      if (distance < minDistance) {
        minDistance = distance;
        nearestCity = city;
      }
    }

    // Log the top 3 closest cities for debugging
    const sortedDistances = distances.sort((a, b) => a.distance - b.distance);
    console.log("🏙️ Top 3 closest cities:", sortedDistances.slice(0, 3));
    console.log(
      `🎯 Selected: ${nearestCity?.name} (${minDistance.toFixed(2)}km)`
    );

    // Only return city if within reasonable distance (200km)
    return minDistance <= 200 ? nearestCity : null;
  }

  // Fallback method for distances >= 200kms
  getIntelligentFallbackCity(coordinates: LocationCoordinates): any | null {
    const lat = coordinates.lat;
    const lng = coordinates.lng;

    console.log(`🌍 Fallback analysis for coordinates: ${lat}, ${lng}`);

    // Calculate distances to all cities and find the closest one
    const cityDistances = EUROPEAN_CITIES.map((city) => ({
      city,
      distance: this.calculateDistance(
        lat,
        lng,
        city.coordinates.lat,
        city.coordinates.lng
      ),
    })).sort((a, b) => a.distance - b.distance);

    console.log(
      "🏙️ All city distances:",
      cityDistances
        .slice(0, 5)
        .map((cd) => `${cd.city.name}: ${cd.distance.toFixed(2)}km`)
    );

    const closestCity = cityDistances[0];
    console.log(
      `🎯 Closest city: ${
        closestCity.city.name
      } (${closestCity.distance.toFixed(2)}km)`
    );

    return closestCity.city;
  }

  /**
   * Get current location state
   */

  async getCurrentLocationState(): Promise<LocationStateResult> {
    // Try cache first
    const cached = this.loadLocationFromStorage();
    if (cached) {
      console.log("📍 Using cached location state:", {
        city: cached.currentCity?.name,
        method: cached.method,
        lastUpdated: new Date(cached.lastUpdated).toLocaleTimeString(),
      });
      return cached;
    }

    // Get fresh location with enhanced logic
    try {
      const coordinates = await this.getCurrentLocation();
      console.log("🌍 Fresh GPS coordinates:", coordinates);

      // Calculate distances to all supported cities and find the closest one
      console.log("📏 Calculating distances to all supported cities...");
      const cityDistances = EUROPEAN_CITIES.map((city) => ({
        city,
        distance: this.calculateDistance(
          coordinates.lat,
          coordinates.lng,
          city.coordinates.lat,
          city.coordinates.lng
        ),
      })).sort((a, b) => a.distance - b.distance);

      console.log(
        "🏙️ Top 5 closest cities:",
        cityDistances
          .slice(0, 5)
          .map((cd) => `${cd.city.name}: ${cd.distance.toFixed(2)}km`)
      );

      const closestCity = cityDistances[0];
      console.log(
        `🎯 Selected closest city: ${
          closestCity.city.name
        } (${closestCity.distance.toFixed(2)}km)`
      );

      // Use the closest city regardless of distance (no 200km limit)
      return this.saveLocationState(coordinates, closestCity.city, "gps");
    } catch (error: any) {
      return {
        currentCity: null,
        detectedCity: null,
        isLoading: false,
        error: error.message,
        canRent: false,
        lastUpdated: Date.now(),
        method: "gps",
        preferredCityMethod: "none",
      };
    }
  }

  /**
   * Check if user is in a supported city
   */
  checkCitySupport(location: LocationCoordinates): CitySupport {
    // Check if user is within any supported city bounds
    for (const city of EUROPEAN_CITIES) {
      const { bounds } = city;

      if (
        location.lat >= bounds.south &&
        location.lat <= bounds.north &&
        location.lng >= bounds.west &&
        location.lng <= bounds.east
      ) {
        return {
          inCity: true,
          cityName: city.id,
          distance: 0,
        };
      }
    }

    // User is not in a supported city, find nearest one
    const distances = EUROPEAN_CITIES.map((city) => ({
      city: city.id,
      name: city.name,
      distance: this.calculateDistance(
        location.lat,
        location.lng,
        city.coordinates.lat,
        city.coordinates.lng
      ),
    }));

    const nearest = distances.reduce((min, curr) =>
      curr.distance < min.distance ? curr : min
    );

    return {
      inCity: false,
      distance: nearest.distance,
      nearestCity: nearest.name,
    };
  }

  // ============= DEVELOPMENT/TESTING METHODS =============

  /**
   * Set manual location for testing
   */
  async setTestLocation(cityId: string): Promise<LocationStateResult> {
    const city = EUROPEAN_CITIES.find((c) => c.id === cityId);

    if (!city) {
      throw new Error(`City ${cityId} not found`);
    }

    const state: LocationStateResult = {
      currentCity: city,
      detectedCity: city,
      isLoading: false,
      error: null,
      canRent: true,
      lastUpdated: Date.now(),
      method: "manual",
      preferredCityMethod: "manual",
    };

    this.saveLocationToStorage(state);
    console.log(`🧪 Test location set: ${city.name}`);
    return state;
  }

  /**
   * Set preferred city manually (persistent)
   */
  async setPreferredCity(cityId: string): Promise<LocationStateResult> {
    const city = EUROPEAN_CITIES.find((c) => c.id === cityId);

    if (!city) {
      throw new Error(`City ${cityId} not found`);
    }

    // Load current state to preserve detected city
    const currentState = this.loadLocationFromStorage();
    const detectedCity = currentState?.detectedCity || city;

    const state: LocationStateResult = {
      currentCity: city, // This becomes the preferred city
      detectedCity: detectedCity, // Keep the detected city separate
      isLoading: false,
      error: null,
      canRent: true,
      lastUpdated: Date.now(),
      method: "manual",
      preferredCityMethod: "manual", // Mark as manually selected
    };

    this.saveLocationToStorage(state);
    console.log(`🎯 Preferred city set to: ${city.name} (${city.id})`);
    console.log(`📍 Detected city remains: ${detectedCity.name}`);
    return state;
  }

  /**
   * Clear location cache
   */
  clearLocationCache(): void {
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem(STORAGE_KEY);
        if (window.sessionStorage) {
          sessionStorage.removeItem(STORAGE_KEY);
        }
      }
      console.log(
        "🗑️ Location cache cleared from both localStorage and sessionStorage"
      );
    } catch (error) {
      console.warn("Failed to clear location:", error);
    }
  }

  /**
   * Force fresh GPS location by clearing cache and getting new coordinates
   */
  async forceFreshGPSLocation(): Promise<LocationStateResult> {
    console.log("🔄 Forcing fresh GPS location...");
    this.clearLocationCache();

    try {
      const coordinates = await this.getCurrentLocation();
      console.log("🌍 Fresh GPS coordinates:", coordinates);

      // Calculate distances to all supported cities and find the closest one
      console.log("📏 Calculating distances to all supported cities...");
      const cityDistances = EUROPEAN_CITIES.map((city) => ({
        city,
        distance: this.calculateDistance(
          coordinates.lat,
          coordinates.lng,
          city.coordinates.lat,
          city.coordinates.lng
        ),
      })).sort((a, b) => a.distance - b.distance);

      console.log(
        "🏙️ Top 5 closest cities:",
        cityDistances
          .slice(0, 5)
          .map((cd) => `${cd.city.name}: ${cd.distance.toFixed(2)}km`)
      );

      const closestCity = cityDistances[0];
      console.log(
        `🎯 Selected closest city: ${
          closestCity.city.name
        } (${closestCity.distance.toFixed(2)}km)`
      );

      const result = this.saveLocationState(
        coordinates,
        closestCity.city,
        "gps"
      );
      console.log("✅ Fresh location result:", {
        city: result.currentCity?.name,
        method: result.method,
        distance: closestCity.distance.toFixed(2) + "km",
      });

      return result;
    } catch (error: any) {
      console.error("❌ Fresh GPS location failed:", error);
      return {
        currentCity: null,
        detectedCity: null,
        isLoading: false,
        error: error.message,
        canRent: false,
        lastUpdated: Date.now(),
        method: "gps",
        preferredCityMethod: "none",
      };
    }
  }

  /**
   * Check location permission (for compatibility)
   */
  async checkLocationPermission(): Promise<"granted" | "denied" | "prompt"> {
    if (!navigator.permissions) {
      return "prompt";
    }

    try {
      const permission = await navigator.permissions.query({
        name: "geolocation" as PermissionName,
      });
      return permission.state as "granted" | "denied" | "prompt";
    } catch (error) {
      console.warn("Could not check location permission:", error);
      return "prompt";
    }
  }

  /**
   * Get real city name from coordinates using Google Maps Geocoding API
   */
  async getRealCityFromCoordinates(
    coordinates: LocationCoordinates
  ): Promise<string | null> {
    try {
      // You'll need to add your Google Maps API key to .env.local
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

      if (!apiKey) {
        console.warn(
          "⚠️ Google Maps API key not found. Using fallback method."
        );
        return null;
      }

      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coordinates.lat},${coordinates.lng}&key=${apiKey}&language=it`
      );

      const data = await response.json();

      if (data.status === "OK" && data.results.length > 0) {
        const result = data.results[0];

        // Look for locality (city) in address components
        for (const component of result.address_components) {
          if (component.types.includes("locality")) {
            console.log("🏙️ Google Maps detected city:", component.long_name);
            return component.long_name;
          }
        }

        // Fallback: use the first result's formatted address
        console.log(
          "🏙️ Google Maps fallback address:",
          result.formatted_address
        );
        return result.formatted_address;
      }

      return null;
    } catch (error) {
      console.error("❌ Google Maps API error:", error);
      return null;
    }
  }

  /**
   * Get location from IP address as fallback
   */
  async getLocationFromIP(): Promise<LocationCoordinates | null> {
    try {
      console.log("🌐 Getting location from IP address...");

      // Try multiple IP geolocation services for redundancy
      const services = [
        "https://ipapi.co/json/",
        "https://ip-api.com/json/",
        "https://api.ipgeolocation.io/ipgeo?apiKey=free",
      ];

      for (const service of services) {
        try {
          const response = await fetch(service, {
            method: "GET",
            headers: { Accept: "application/json" },
          });

          if (response.ok) {
            const data = await response.json();

            if (data.latitude && data.longitude) {
              console.log("✅ IP geolocation successful:", {
                lat: data.latitude,
                lng: data.longitude,
                city: data.city || data.locality || "Unknown",
              });

              return {
                lat: parseFloat(data.latitude),
                lng: parseFloat(data.longitude),
              };
            }
          }
        } catch (serviceError) {
          console.warn(`⚠️ IP service ${service} failed:`, serviceError);
          continue;
        }
      }

      console.warn("❌ All IP geolocation services failed");
      return null;
    } catch (error) {
      console.error("❌ IP geolocation error:", error);
      return null;
    }
  }

  /**
   * Universal location detection with multiple fallbacks
   */
  async getUniversalLocation(): Promise<LocationStateResult> {
    console.log("🌍 Universal location detection starting...");
    this.clearLocationCache();

    let coordinates: LocationCoordinates | null = null;
    let method: "gps" | "ip" | "manual" = "manual";
    let error: string | null = null;

    // Step 1: Try GPS (most accurate)
    try {
      console.log("📱 Step 1: Trying GPS location...");
      coordinates = await this.getCurrentLocation();
      method = "gps";
      console.log("✅ GPS location successful:", coordinates);

      // Check if GPS coordinates are suspicious (like Vicenza coordinates)
      if (coordinates.lat === 45.645824 && coordinates.lng === 11.4327552) {
        console.warn(
          "⚠️ Detected suspicious GPS coordinates (Vicenza fallback). Trying IP geolocation..."
        );
        try {
          const ipCoordinates = await this.getLocationFromIP();
          if (ipCoordinates) {
            coordinates = ipCoordinates;
            method = "ip";
            console.log("✅ Switched to IP geolocation:", coordinates);
          }
        } catch (ipError: any) {
          console.warn("⚠️ IP geolocation failed:", ipError.message);
        }
      }
    } catch (gpsError: any) {
      console.warn("⚠️ GPS failed:", gpsError.message);

      // Step 2: Try IP geolocation
      try {
        console.log("🌐 Step 2: Trying IP geolocation...");
        coordinates = await this.getLocationFromIP();
        if (coordinates) {
          method = "ip";
          console.log("✅ IP geolocation successful:", coordinates);
        }
      } catch (ipError: any) {
        console.warn("⚠️ IP geolocation failed:", ipError.message);
      }
    }

    // If we have coordinates, process them
    if (coordinates) {
      // Try Google Maps verification first
      const realCityName = await this.getRealCityFromCoordinates(coordinates);

      if (realCityName) {
        console.log("✅ Google Maps city verification:", realCityName);

        // Check if the detected city matches any of our supported cities
        const matchedCity = EUROPEAN_CITIES.find(
          (city) =>
            city.name.toLowerCase().includes(realCityName.toLowerCase()) ||
            realCityName.toLowerCase().includes(city.name.toLowerCase())
        );

        if (matchedCity) {
          console.log("🎯 Matched with supported city:", matchedCity.name);
          return this.saveLocationState(coordinates, matchedCity, method);
        }
      }

      // Calculate distances to all supported cities
      console.log("📏 Calculating distances to all supported cities...");
      const cityDistances = EUROPEAN_CITIES.map((city) => ({
        city,
        distance: this.calculateDistance(
          coordinates.lat,
          coordinates.lng,
          city.coordinates.lat,
          city.coordinates.lng
        ),
      })).sort((a, b) => a.distance - b.distance);

      console.log(
        "🏙️ Top 5 closest cities:",
        cityDistances
          .slice(0, 5)
          .map((cd) => `${cd.city.name}: ${cd.distance.toFixed(2)}km`)
      );

      const closestCity = cityDistances[0];
      console.log(
        `🎯 Selected closest city: ${
          closestCity.city.name
        } (${closestCity.distance.toFixed(2)}km)`
      );

      const result = this.saveLocationState(
        coordinates,
        closestCity.city,
        method
      );

      console.log("✅ Universal location result:", {
        city: result.currentCity?.name,
        method: result.method,
        googleCity: realCityName || "Not available",
        distance: closestCity.distance.toFixed(2) + "km",
        source:
          method === "gps"
            ? "GPS"
            : method === "ip"
            ? "IP Geolocation"
            : "Manual",
      });

      return result;
    }

    // Step 3: Ultimate fallback - use default city
    console.log("🔄 Step 3: Using default city (Rome) as ultimate fallback");
    const defaultCity = EUROPEAN_CITIES.find((city) => city.id === "rome");

    if (defaultCity) {
      error = "Location detection failed. Using Rome as default city.";
      return this.saveLocationState(
        defaultCity.coordinates,
        defaultCity,
        "manual",
        error
      );
    }

    // If everything fails
    console.error("❌ All location methods failed");
    return {
      currentCity: null,
      detectedCity: null,
      isLoading: false,
      error: "Unable to determine location. Please try again.",
      canRent: false,
      lastUpdated: Date.now(),
      method: "manual",
      preferredCityMethod: "none",
    };
  }

  /**
   * Enhanced GPS location with Google Maps verification and distance calculation
   */
  async getEnhancedGPSLocation(): Promise<LocationStateResult> {
    console.log("🔄 Getting enhanced GPS location with Google verification...");
    this.clearLocationCache();

    try {
      const coordinates = await this.getCurrentLocation();
      console.log("🌍 GPS coordinates received:", coordinates);

      // Try to get real city from Google Maps
      const realCityName = await this.getRealCityFromCoordinates(coordinates);

      if (realCityName) {
        console.log("✅ Google Maps city verification:", realCityName);

        // Check if the detected city matches any of our supported cities
        const matchedCity = EUROPEAN_CITIES.find(
          (city) =>
            city.name.toLowerCase().includes(realCityName.toLowerCase()) ||
            realCityName.toLowerCase().includes(city.name.toLowerCase())
        );

        if (matchedCity) {
          console.log("🎯 Matched with supported city:", matchedCity.name);
          return this.saveLocationState(coordinates, matchedCity, "gps");
        }
      }

      // Calculate distances to all supported cities and find the closest one
      console.log("📏 Calculating distances to all supported cities...");
      const cityDistances = EUROPEAN_CITIES.map((city) => ({
        city,
        distance: this.calculateDistance(
          coordinates.lat,
          coordinates.lng,
          city.coordinates.lat,
          city.coordinates.lng
        ),
      })).sort((a, b) => a.distance - b.distance);

      console.log(
        "🏙️ All city distances:",
        cityDistances
          .slice(0, 5)
          .map((cd) => `${cd.city.name}: ${cd.distance.toFixed(2)}km`)
      );

      const closestCity = cityDistances[0];
      console.log(
        `🎯 Closest city: ${
          closestCity.city.name
        } (${closestCity.distance.toFixed(2)}km)`
      );

      // Use the closest city regardless of distance (no 200km limit)
      const result = this.saveLocationState(
        coordinates,
        closestCity.city,
        "gps"
      );

      console.log("✅ Enhanced location result:", {
        city: result.currentCity?.name,
        method: result.method,
        googleCity: realCityName || "Not available",
        distance: closestCity.distance.toFixed(2) + "km",
      });

      return result;
    } catch (error: any) {
      console.error("❌ Enhanced GPS location failed:", error);
      return {
        currentCity: null,
        detectedCity: null,
        isLoading: false,
        error: error.message,
        canRent: false,
        lastUpdated: Date.now(),
        method: "gps",
        preferredCityMethod: "none",
      };
    }
  }

  // ============= NEARBY VEHICLES METHODS =============

  /**
   * Get nearby vehicles within specified radius
   */
  async getNearbyVehicles(
    location: LocationCoordinates,
    radiusKm: number = 2,
    vehicleType?: VehicleType,
    onlyAvailable: boolean = true
  ): Promise<NearbyVehicle[]> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    const nearbyVehicles: NearbyVehicle[] = [];

    this.vehicleLocations.forEach((vehicle) => {
      // Filter by availability if requested
      if (onlyAvailable && !vehicle.isAvailable) return;

      // Filter by vehicle type if specified
      if (vehicleType && vehicle.vehicleType !== vehicleType) return;

      const distance = this.calculateDistance(
        location.lat,
        location.lng,
        vehicle.coordinates.lat,
        vehicle.coordinates.lng
      );

      if (distance <= radiusKm) {
        nearbyVehicles.push({
          vehicleId: vehicle.vehicleId,
          vehicleType: vehicle.vehicleType,
          location: {
            lat: vehicle.coordinates.lat,
            lng: vehicle.coordinates.lng,
          },
          distance,
          batteryLevel: vehicle.batteryLevel,
          estimatedRange: vehicle.estimatedRange,
          isAvailable: vehicle.isAvailable,
          lastUpdate: vehicle.lastUpdate,
          cityId: vehicle.cityId,
        });
      }
    });

    // Sort by distance
    return nearbyVehicles.sort((a, b) => a.distance - b.distance);
  }

  // Get vehicles near user location
  getVehiclesNearLocation(
    userLat: number,
    userLng: number,
    radiusKm: number = 2,
    vehicleType?: VehicleType
  ): (VehicleLocation & { distance: number })[] {
    const nearbyVehicles: (VehicleLocation & { distance: number })[] = [];

    this.vehicleLocations.forEach((vehicle) => {
      if (!vehicle.isAvailable) return;
      if (vehicleType && vehicle.vehicleType !== vehicleType) return;

      const distance = this.calculateDistance(
        userLat,
        userLng,
        vehicle.coordinates.lat,
        vehicle.coordinates.lng
      );

      if (distance <= radiusKm) {
        nearbyVehicles.push({
          ...vehicle,
          distance,
        });
      }
    });

    return nearbyVehicles.sort((a, b) => a.distance - b.distance);
  }

  // Get vehicles in specific city
  getVehiclesInCity(
    cityId: string,
    vehicleType?: VehicleType
  ): VehicleLocation[] {
    const cityVehicles: VehicleLocation[] = [];

    this.vehicleLocations.forEach((vehicle) => {
      if (vehicle.cityId !== cityId) return;
      if (!vehicle.isAvailable) return;
      if (vehicleType && vehicle.vehicleType !== vehicleType) return;

      cityVehicles.push(vehicle);
    });

    return cityVehicles;
  }

  // ============= UTILITY METHODS =============

  calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  // ============= VEHICLE FLEET METHODS (existing) =============

  initializeVehicleFleet(): void {
    EUROPEAN_CITIES.forEach((city) => {
      Object.entries(city.vehicleLimit).forEach(([vehicleType, limit]) => {
        if (
          limit > 0 &&
          city.allowedVehicles.includes(vehicleType as VehicleType)
        ) {
          for (let i = 0; i < limit; i++) {
            const vehicleId = this.generateVehicleId(
              city.id,
              vehicleType as VehicleType,
              i
            );
            const location = this.generateRandomLocationInCity(city);

            this.vehicleLocations.set(vehicleId, {
              vehicleId,
              vehicleType: vehicleType as VehicleType,
              cityId: city.id,
              coordinates: location,
              batteryLevel: Math.floor(Math.random() * 40) + 60, // 60-100%
              isAvailable: Math.random() > 0.15, // 85% available
              lastUpdate: new Date(),
              estimatedRange: this.calculateRange(vehicleType as VehicleType),
            });
          }
        }
      });
    });
  }

  private generateVehicleId(
    cityId: string,
    vehicleType: VehicleType,
    index: number
  ): string {
    const typeCode = {
      bike: "BK",
      scooter: "SC",
      monopattino: "MP",
    }[vehicleType];

    const cityCode = cityId.substring(0, 3).toUpperCase();
    return `MOOVE-${cityCode}-${typeCode}-${(index + 1)
      .toString()
      .padStart(3, "0")}`;
  }

  private generateRandomLocationInCity(city: CityConfig): {
    lat: number;
    lng: number;
  } {
    const latRange = city.bounds.north - city.bounds.south;
    const lngRange = city.bounds.east - city.bounds.west;

    return {
      lat: city.bounds.south + Math.random() * latRange,
      lng: city.bounds.west + Math.random() * lngRange,
    };
  }

  private calculateRange(vehicleType: VehicleType): number {
    const ranges = {
      bike: [25, 50], // 25-50km
      scooter: [30, 60], // 30-60km
      monopattino: [15, 35], // 15-35km
    };

    const [min, max] = ranges[vehicleType];
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // Vehicle management methods (existing)
  reserveVehicle(vehicleId: string): boolean {
    const vehicle = this.vehicleLocations.get(vehicleId);
    if (vehicle && vehicle.isAvailable) {
      vehicle.isAvailable = false;
      vehicle.lastUpdate = new Date();
      return true;
    }
    return false;
  }

  releaseVehicle(
    vehicleId: string,
    newLocation?: { lat: number; lng: number }
  ): void {
    const vehicle = this.vehicleLocations.get(vehicleId);
    if (vehicle) {
      vehicle.isAvailable = true;
      vehicle.lastUpdate = new Date();
      if (newLocation) {
        vehicle.coordinates = newLocation;
      }
      vehicle.batteryLevel = Math.max(
        0,
        vehicle.batteryLevel - Math.floor(Math.random() * 20)
      );
    }
  }

  getVehicle(vehicleId: string): VehicleLocation | undefined {
    return this.vehicleLocations.get(vehicleId);
  }

  getAllVehicles(): VehicleLocation[] {
    return Array.from(this.vehicleLocations.values());
  }

  updateVehicleLocation(
    vehicleId: string,
    newLocation: { lat: number; lng: number }
  ): void {
    const vehicle = this.vehicleLocations.get(vehicleId);
    if (vehicle) {
      vehicle.coordinates = newLocation;
      vehicle.lastUpdate = new Date();
    }
  }
}

// ============= HELPER FUNCTIONS (existing) =============

export function formatDistance(distanceKm: number): string {
  if (distanceKm < 0.1) {
    return "Very close";
  } else if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m`;
  } else {
    return `${distanceKm.toFixed(1)}km`;
  }
}

export function getBatteryColor(level: number): string {
  if (level > 70) return "text-green-600";
  if (level > 30) return "text-yellow-600";
  return "text-red-600";
}

export function getVehicleEmoji(type: VehicleType): string {
  switch (type) {
    case "bike":
      return "🚲";
    case "scooter":
      return "🛴";
    case "monopattino":
      return "🛵";
    default:
      return "🚲";
  }
}

// Export default for compatibility
export default VehicleGeolocationSystem;
