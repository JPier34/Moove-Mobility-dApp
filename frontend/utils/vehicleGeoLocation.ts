import { VehicleType } from "@/config/cities";
import { EUROPEAN_CITIES } from "@/config/cities";
import { CityConfig } from "@/config/cities";

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

export class VehicleGeolocationSystem {
  private static instance: VehicleGeolocationSystem;
  private vehicleLocations: Map<string, VehicleLocation> = new Map();

  static getInstance(): VehicleGeolocationSystem {
    if (!VehicleGeolocationSystem.instance) {
      VehicleGeolocationSystem.instance = new VehicleGeolocationSystem();
    }
    return VehicleGeolocationSystem.instance;
  }

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

  // Get vehicles near user location
  getVehiclesNearLocation(
    userLat: number,
    userLng: number,
    radiusKm: number = 2,
    vehicleType?: VehicleType
  ): VehicleLocation[] {
    const nearbyVehicles: VehicleLocation[] = [];

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
          // Add distance for sorting
          distance,
        } as VehicleLocation & { distance: number });
      }
    });

    // Sort by distance
    return nearbyVehicles.sort((a: any, b: any) => a.distance - b.distance);
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
}
