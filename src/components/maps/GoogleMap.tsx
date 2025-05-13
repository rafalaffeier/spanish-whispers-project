
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
  onMapLoaded?: () => void;
}

const GoogleMap: React.FC<GoogleMapProps> = ({
  center = { lat: 40.416775, lng: -3.703790 }, // Default: Madrid, España
  zoom = 12,
  markers = [],
  height = '400px',
  width = '100%',
  className = '',
  onMapLoaded
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const loadingRef = useRef<boolean>(false);
  const apiKey = 'AIzaSyBBJ4VFjgclhCQMDL1hkOzsvZBXJimCllc';

  // Limpiar marcadores existentes
  const clearMarkers = () => {
    if (markersRef.current.length > 0) {
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];
    }
  };

  // Añadir marcadores al mapa
  const addMarkers = () => {
    if (!mapInstanceRef.current) return;
    
    clearMarkers();
    
    markers.forEach(marker => {
      try {
        const newMarker = new google.maps.Marker({
          position: marker.position,
          map: mapInstanceRef.current,
          title: marker.title || '',
        });
        
        markersRef.current.push(newMarker);
      } catch (error) {
        console.error('[GoogleMap] Error adding marker:', error);
      }
    });
    
    console.log(`[GoogleMap] Added ${markersRef.current.length} markers`);
  };

  useEffect(() => {
    // Función para cargar el mapa
    const loadMap = () => {
      if (!mapRef.current) return;
      
      console.log('[GoogleMap] Loading map with center:', center);
      
      try {
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
        
        // Añadir marcadores
        addMarkers();
        
        // Notificar que el mapa se ha cargado
        if (onMapLoaded) {
          window.google.maps.event.addListenerOnce(mapInstanceRef.current, 'idle', () => {
            console.log('[GoogleMap] Map idle event triggered');
            onMapLoaded();
          });
        }
        
        console.log('[GoogleMap] Map successfully loaded');
      } catch (error) {
        console.error('[GoogleMap] Error initializing map:', error);
      }
    };

    // Función para cargar el API de Google Maps
    const loadGoogleMapsApi = () => {
      if (window.google && window.google.maps) {
        console.log('[GoogleMap] Google Maps API already loaded');
        loadMap();
        return;
      }

      if (loadingRef.current) {
        console.log('[GoogleMap] Google Maps API is already loading');
        return;
      }
      
      loadingRef.current = true;
      console.log('[GoogleMap] Starting to load Google Maps API');

      const callbackName = 'googleMapsInitCallback_' + Math.random().toString(36).substr(2, 9);
      
      // Definir la función de callback en el objeto window
      window[callbackName] = () => {
        console.log('[GoogleMap] Google Maps callback executed');
        loadingRef.current = false;
        loadMap();
        // Limpiar la función de callback después de usarla
        delete window[callbackName];
      };

      // Crear script para cargar la API de Google Maps
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=${callbackName}`;
      script.async = true;
      script.defer = true;
      
      script.onerror = () => {
        console.error('[GoogleMap] Error loading Google Maps API');
        loadingRef.current = false;
      };
      
      document.head.appendChild(script);
      console.log('[GoogleMap] Google Maps API script appended to document head');

      return () => {
        if (window[callbackName]) {
          delete window[callbackName];
        }
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
      };
    };

    loadGoogleMapsApi();
    
    // Cleanup function
    return () => {
      clearMarkers();
    };
  }, []); // Solo ejecutar al montar

  // Actualizar el mapa cuando cambien las propiedades
  useEffect(() => {
    if (mapInstanceRef.current) {
      console.log('[GoogleMap] Updating map center and zoom');
      mapInstanceRef.current.setCenter(center);
      mapInstanceRef.current.setZoom(zoom);
      
      // Actualizar marcadores
      addMarkers();
    }
  }, [center, zoom, markers]);

  return (
    <div className={className}>
      <div 
        ref={mapRef} 
        style={{ height, width }} 
        data-testid="google-map"
      />
    </div>
  );
};

export default GoogleMap;
