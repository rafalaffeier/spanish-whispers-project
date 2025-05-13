
import React, { useEffect, useRef } from 'react';

// Definir el tipo para las propiedades del componente
interface GoogleMapProps {
  center?: { lat: number; lng: number };
  zoom?: number;
  markers?: Array<{
    position: { lat: number; lng: number };
    title?: string;
  }>;
  height?: string;
  width?: string;
  className?: string;
}

// Declarar la variable global de Google Maps ya está en vite-env.d.ts

const GoogleMap: React.FC<GoogleMapProps> = ({
  center = { lat: 40.416775, lng: -3.703790 }, // Default: Madrid, España
  zoom = 12,
  markers = [],
  height = '400px',
  width = '100%',
  className = '',
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const loadingRef = useRef<boolean>(false);
  const apiKey = 'AIzaSyBBJ4VFjgclhCQMDL1hkOzsvZBXJimCllc';

  useEffect(() => {
    // Función para cargar el mapa
    const loadMap = () => {
      if (!mapRef.current) return;
      
      // Inicializar el mapa
      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
        center,
        zoom,
        mapTypeId: window.google.maps.MapTypeId.ROADMAP,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
        zoomControl: true,
      });

      // Agregar marcadores si existen
      markers.forEach(marker => {
        new window.google.maps.Marker({
          position: marker.position,
          map: mapInstanceRef.current,
          title: marker.title || '',
        });
      });
    };

    // Función para cargar el API de Google Maps
    const loadGoogleMapsApi = () => {
      if (window.google && window.google.maps) {
        loadMap();
        return;
      }

      if (loadingRef.current) return;
      loadingRef.current = true;

      window.initMap = () => {
        loadingRef.current = false;
        loadMap();
      };

      // Crear script para cargar la API de Google Maps
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initMap`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);

      return () => {
        window.initMap = () => {};
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
      };
    };

    loadGoogleMapsApi();
  }, [center, zoom, markers]);

  // Actualizar el mapa cuando cambien las propiedades
  useEffect(() => {
    if (mapInstanceRef.current && window.google) {
      mapInstanceRef.current.setCenter(center);
      mapInstanceRef.current.setZoom(zoom);
    }
  }, [center, zoom]);

  return (
    <div className={className}>
      <div ref={mapRef} style={{ height, width }} />
    </div>
  );
};

export default GoogleMap;
