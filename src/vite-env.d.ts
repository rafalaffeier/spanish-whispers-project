
/// <reference types="vite/client" />

// Google Maps types
declare namespace google {
  namespace maps {
    class Map {
      constructor(element: HTMLElement, options: MapOptions);
      setCenter(center: LatLng): void;
      setZoom(zoom: number): void;
    }
    
    class Marker {
      constructor(options: MarkerOptions);
    }
    
    interface MapOptions {
      center: LatLng;
      zoom: number;
      mapTypeId?: string;
      mapTypeControl?: boolean;
      streetViewControl?: boolean;
      fullscreenControl?: boolean;
      zoomControl?: boolean;
    }
    
    interface MarkerOptions {
      position: LatLng;
      map: Map;
      title?: string;
    }
    
    interface LatLng {
      lat: number;
      lng: number;
    }
    
    const MapTypeId: {
      ROADMAP: string;
      SATELLITE: string;
      HYBRID: string;
      TERRAIN: string;
    };
  }
}
