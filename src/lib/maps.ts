import { setOptions, importLibrary } from "@googlemaps/js-api-loader";

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

let isConfigured = false;
if (GOOGLE_MAPS_API_KEY) {
  setOptions({
    key: GOOGLE_MAPS_API_KEY,
    v: "weekly"
  });
  isConfigured = true;
}

let googleInstance: any = null;

/**
 * Loads the Google Maps instance dynamically.
 * Returns null if API key is not configured, which triggers standard high-fidelity simulated routes.
 */
export async function getGoogleMaps(): Promise<any> {
  if (googleInstance) return googleInstance;
  if (typeof window !== "undefined" && (window as any).google) {
    googleInstance = (window as any).google;
    return googleInstance;
  }
  if (!isConfigured) return null;

  try {
    // Import both required libraries to bootstrap the global 'google' object
    await importLibrary("maps");
    await importLibrary("places");
    
    if (typeof window !== "undefined" && (window as any).google) {
      googleInstance = (window as any).google;
      return googleInstance;
    }
    return null;
  } catch (error) {
    console.error("Failed to load Google Maps SDK:", error);
    return null;
  }
}

// Structured coordinate database for Togo's major commerce Hubs for fallback route generation
export interface LocationCoords {
  lat: number;
  lng: number;
  name: string;
}

export const TOGO_HUBS: Record<string, LocationCoords> = {
  LOME: { lat: 6.1375, lng: 1.2125, name: "Lomé (Grand Marché, Assigamé)" },
  KPALIME: { lat: 6.9014, lng: 0.6389, name: "Kpalimé (Région des Plateaux)" },
  ATAKPAME: { lat: 7.5281, lng: 1.1250, name: "Atakpamé (Hinterland)" },
  SOKODE: { lat: 8.9833, lng: 1.1333, name: "Sokodé (Région Centrale)" },
  KARA: { lat: 9.5511, lng: 1.1861, name: "Kara (Région de la Kara)" },
  DAPAONG: { lat: 10.8583, lng: 0.2078, name: "Dapaong (Région des Savanes)" },
  PORT_LOME: { lat: 6.1311, lng: 1.2825, name: "Port Autonome de Lomé (PAL)" },
  LGF_HQ: { lat: 6.1724, lng: 1.2312, name: "LGF Headquarters (Totsi, Lomé)" }
};

export interface RouteCalculationResult {
  origin: string;
  destination: string;
  distanceKm: number;
  durationMinutes: number;
  startCoords: { lat: number; lng: number };
  endCoords: { lat: number; lng: number };
  polylinePath: { lat: number; lng: number }[];
  isSimulated: boolean;
}

/**
 * Normalizes input address to return closest known Togo coordinate.
 */
function findClosestHub(address: string): LocationCoords {
  const clean = address.toUpperCase();
  if (clean.includes("KPALIME")) return TOGO_HUBS.KPALIME;
  if (clean.includes("ATAKPAME")) return TOGO_HUBS.ATAKPAME;
  if (clean.includes("SOKODE")) return TOGO_HUBS.SOKODE;
  if (clean.includes("KARA")) return TOGO_HUBS.KARA;
  if (clean.includes("DAPAONG")) return TOGO_HUBS.DAPAONG;
  if (clean.includes("PORT") || clean.includes("PAL")) return TOGO_HUBS.PORT_LOME;
  if (clean.includes("LGF") || clean.includes("HEADQUARTER") || clean.includes("HQ") || clean.includes("TOTSI")) return TOGO_HUBS.LGF_HQ;
  
  // Default to Lomé
  return TOGO_HUBS.LOME;
}

/**
 * Generates an elegant curve of coordinates between two locations for smooth map rendering.
 */
function generateSinuousPath(
  start: { lat: number; lng: number },
  end: { lat: number; lng: number },
  steps = 20
): { lat: number; lng: number }[] {
  const path: { lat: number; lng: number }[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    // Linear interpolation
    const lat = start.lat + (end.lat - start.lat) * t;
    const lng = start.lng + (end.lng - start.lng) * t;
    
    // Add a slight sinuous distortion so it looks like a real Togo national road routing
    const distortion = Math.sin(t * Math.PI) * 0.015;
    path.push({
      lat: lat + (i % 2 === 0 ? distortion : -distortion),
      lng: lng + (i % 3 === 0 ? distortion * 0.5 : -distortion * 0.5)
    });
  }
  return path;
}

/**
 * Calculates Route Metrics.
 * Uses live Google Maps Directions & Distance Services if configured, 
 * otherwise executes high-fidelity geodetic models with local Togo GPS nodes.
 */
export async function calculateRoute(
  originAddress: string,
  destinationAddress: string
): Promise<RouteCalculationResult> {
  const google = await getGoogleMaps();

  const originHub = findClosestHub(originAddress);
  const destHub = findClosestHub(destinationAddress);

  // If origin and destination map to the exact same location node, add a minor offset for local courier routing
  const finalDest = (originHub.lat === destHub.lat && originHub.lng === destHub.lng)
    ? { lat: destHub.lat + 0.025, lng: destHub.lng + 0.018, name: destHub.name + " (Local Delivery Zone)" }
    : destHub;

  if (google && google.maps) {
    try {
      return new Promise((resolve) => {
        const directionsService = new google.maps.DirectionsService();
        directionsService.route(
          {
            origin: originAddress,
            destination: destinationAddress,
            travelMode: google.maps.TravelMode.DRIVING,
          },
          (response: any, status: string) => {
            if (status === "OK" && response.routes[0]) {
              const leg = response.routes[0].legs[0];
              const path = response.routes[0].overview_path.map((p: any) => ({
                lat: p.lat(),
                lng: p.lng()
              }));
              
              resolve({
                origin: originAddress,
                destination: destinationAddress,
                distanceKm: parseFloat((leg.distance.value / 1000).toFixed(1)),
                durationMinutes: Math.round(leg.duration.value / 60),
                startCoords: { lat: leg.start_location.lat(), lng: leg.start_location.lng() },
                endCoords: { lat: leg.end_location.lat(), lng: leg.end_location.lng() },
                polylinePath: path,
                isSimulated: false
              });
            } else {
              throw new Error("Directions call unsuccessful");
            }
          }
        );
      });
    } catch (err) {
      console.warn("Google Maps Service route generation failed, using high-fidelity local hub model:", err);
    }
  }

  // Fallback high-fidelity geodetic calculation (Haversine formula + curvature coefficient)
  const R = 6371; // Earth's radius in km
  const dLat = ((finalDest.lat - originHub.lat) * Math.PI) / 180;
  const dLng = ((finalDest.lng - originHub.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((originHub.lat * Math.PI) / 180) *
      Math.cos((finalDest.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  // Apply a 1.28x road winding correction factor for Togolese national infrastructure (Route Nationale N1)
  let distanceKm = parseFloat((R * c * 1.28).toFixed(1));
  if (distanceKm < 2) distanceKm = 4.2; // minimum delivery range

  // Average speed in Togo (combining urban Lomé traffic & national highway speeds)
  const averageSpeedKmh = distanceKm > 50 ? 65 : 30;
  let durationMinutes = Math.round((distanceKm / averageSpeedKmh) * 60 + 5); // Add 5m buffer for dispatch
  if (durationMinutes < 10) durationMinutes = 15;

  const polylinePath = generateSinuousPath(originHub, finalDest);

  return {
    origin: originHub.name,
    destination: finalDest.name,
    distanceKm,
    durationMinutes,
    startCoords: { lat: originHub.lat, lng: originHub.lng },
    endCoords: { lat: finalDest.lat, lng: finalDest.lng },
    polylinePath,
    isSimulated: true
  };
}
