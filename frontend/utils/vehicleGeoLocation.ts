import { VehicleType } from "@/config/cities";
import { EUROPEAN_CITIES } from "@/config/cities";
import { CityConfig } from "@/config/cities";

// ============= TYPES =============
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
  distance: number; // in km
  batteryLevel: number; // percentage
  estimatedRange: number; // in km
  isAvailable: boolean;
  lastUpdate: Date;
  cityId: string;
}

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
  enableHighAccuracy: true,
  timeout: 15000, // 15 seconds
  maximumAge: 300000, // 5 minutes cache
};

export class VehicleGeolocationSystem {
  private static instance: VehicleGeolocationSystem;
  private vehicleLocations: Map<string, VehicleLocation> = new Map();
  private cachedLocation: LocationCoordinates | null = null;
  private cacheTimestamp: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  static getInstance(): VehicleGeolocationSystem {
    if (!VehicleGeolocationSystem.instance) {
      VehicleGeolocationSystem.instance = new VehicleGeolocationSystem();
      VehicleGeolocationSystem.instance.initializeVehicleFleet();
    }
    return VehicleGeolocationSystem.instance;
  }

  constructor() {
    // Allow direct instantiation for new usage pattern
    if (!this.vehicleLocations.size) {
      this.initializeVehicleFleet();
    }
  }

  // ============= GEOLOCATION METHODS (NUOVI) =============

  /**
   * Get current user location with caching
   */
  async getCurrentLocation(): Promise<LocationCoordinates> {
    // Check if we have a valid cached location
    const now = Date.now();
    if (
      this.cachedLocation &&
      now - this.cacheTimestamp < this.CACHE_DURATION
    ) {
      return this.cachedLocation;
    }

    // Check if geolocation is supported
    if (!navigator.geolocation) {
      throw new Error("Geolocation is not supported by this browser");
    }

    return new Promise<LocationCoordinates>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location: LocationCoordinates = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };

          // Cache the location
          this.cachedLocation = location;
          this.cacheTimestamp = now;

          resolve(location);
        },
        (error) => {
          let message: string;
          switch (error.code) {
            case error.PERMISSION_DENIED:
              message =
                "Location access denied. Please enable location services and refresh the page.";
              break;
            case error.POSITION_UNAVAILABLE:
              message =
                "Location information unavailable. Please check your GPS settings.";
              break;
            case error.TIMEOUT:
              message = "Location request timed out. Please try again.";
              break;
            default:
              message =
                "An unknown error occurred while getting your location.";
          }
          reject(new Error(message));
        },
        GEOLOCATION_OPTIONS
      );
    });
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

  /**
   * Get nearby vehicles within specified radius
   */
  async getNearbyVehicles(
    location: LocationCoordinates,
    radiusKm: number = 2,
    vehicleType?: VehicleType,
    onlyAvailable: boolean = true
  ): Promise<NearbyVehicle[]> {
    try {
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
    } catch (error) {
      console.error("Error fetching nearby vehicles:", error);
      throw new Error("Failed to fetch nearby vehicles. Please try again.");
    }
  }

  // ============= FLEET MANAGEMENT METHODS (ESISTENTI) =============

  // Generate random vehicles in cities
  initializeVehicleFleet(): void {
    EUROPEAN_CITIES.forEach((city) => {
      // Generate vehicles for each type based on city limits
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

  // Get vehicles near user location (AGGIORNATO per compatibilità)
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

    // Sort by distance
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

  // Calculate distance between two points (Haversine formula)
  private calculateDistance(
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

  // ============= UTILITY METHODS (NUOVI) =============

  /**
   * Clear location cache
   */
  clearLocationCache(): void {
    this.cachedLocation = null;
    this.cacheTimestamp = 0;
  }

  /**
   * Get cached location if available
   */
  getCachedLocation(): LocationCoordinates | null {
    const now = Date.now();
    if (
      this.cachedLocation &&
      now - this.cacheTimestamp < this.CACHE_DURATION
    ) {
      return this.cachedLocation;
    }
    return null;
  }

  /**
   * Check if location permissions are granted
   */
  async checkLocationPermission(): Promise<"granted" | "denied" | "prompt"> {
    if (!navigator.permissions) {
      return "prompt"; // Assume prompt if Permissions API not available
    }

    try {
      const permission = await navigator.permissions.query({
        name: "geolocation",
      });
      return permission.state;
    } catch (error) {
      console.warn("Could not check location permission:", error);
      return "prompt";
    }
  }

  /**
   * Get distance to nearest supported city
   */
  async getDistanceToNearestCity(location?: LocationCoordinates): Promise<{
    city: string;
    distance: number;
  }> {
    const userLocation = location || (await this.getCurrentLocation());

    const distances = EUROPEAN_CITIES.map((city) => ({
      city: city.name,
      distance: this.calculateDistance(
        userLocation.lat,
        userLocation.lng,
        city.coordinates.lat,
        city.coordinates.lng
      ),
    }));

    return distances.reduce((min, curr) =>
      curr.distance < min.distance ? curr : min
    );
  }

  // ============= VEHICLE MANAGEMENT METHODS (ESISTENTI) =============

  // Reserve a vehicle
  reserveVehicle(vehicleId: string): boolean {
    const vehicle = this.vehicleLocations.get(vehicleId);
    if (vehicle && vehicle.isAvailable) {
      vehicle.isAvailable = false;
      vehicle.lastUpdate = new Date();
      return true;
    }
    return false;
  }

  // Release a vehicle
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
      // Simulate battery drain
      vehicle.batteryLevel = Math.max(
        0,
        vehicle.batteryLevel - Math.floor(Math.random() * 20)
      );
    }
  }

  // Get vehicle by ID
  getVehicle(vehicleId: string): VehicleLocation | undefined {
    return this.vehicleLocations.get(vehicleId);
  }

  // Get all vehicles (for admin)
  getAllVehicles(): VehicleLocation[] {
    return Array.from(this.vehicleLocations.values());
  }

  // Update vehicle location (simulate movement)
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

  // ============= STATISTICS METHODS (NUOVI) =============

  /**
   * Get vehicle statistics for a city
   */
  getCityStats(cityId: string): {
    total: number;
    available: number;
    inUse: number;
    byType: Record<VehicleType, number>;
  } {
    const vehicles = Array.from(this.vehicleLocations.values()).filter(
      (v) => v.cityId === cityId
    );

    const stats = {
      total: vehicles.length,
      available: vehicles.filter((v) => v.isAvailable).length,
      inUse: vehicles.filter((v) => !v.isAvailable).length,
      byType: {
        bike: vehicles.filter((v) => v.vehicleType === "bike").length,
        scooter: vehicles.filter((v) => v.vehicleType === "scooter").length,
        monopattino: vehicles.filter((v) => v.vehicleType === "monopattino")
          .length,
      } as Record<VehicleType, number>,
    };

    return stats;
  }

  /**
   * Get global fleet statistics
   */
  getGlobalStats(): {
    totalVehicles: number;
    availableVehicles: number;
    activeCities: number;
    averageBattery: number;
  } {
    const allVehicles = Array.from(this.vehicleLocations.values());
    const activeCities = new Set(allVehicles.map((v) => v.cityId)).size;
    const avgBattery =
      allVehicles.reduce((sum, v) => sum + v.batteryLevel, 0) /
      allVehicles.length;

    return {
      totalVehicles: allVehicles.length,
      availableVehicles: allVehicles.filter((v) => v.isAvailable).length,
      activeCities,
      averageBattery: Math.round(avgBattery),
    };
  }
}

// ============= HELPER FUNCTIONS =============

/**
 * Format distance for display
 */
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 0.1) {
    return "Very close";
  } else if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m`;
  } else {
    return `${distanceKm.toFixed(1)}km`;
  }
}

/**
 * Get battery level color
 */
export function getBatteryColor(level: number): string {
  if (level > 70) return "text-green-600";
  if (level > 30) return "text-yellow-600";
  return "text-red-600";
}

/**
 * Get vehicle type emoji
 */
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

// Export default per compatibilità
export default VehicleGeolocationSystem;
