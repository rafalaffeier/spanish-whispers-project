
import { useState, useEffect } from 'react';

export const useGeolocation = () => {
  const [location, setLocation] = useState<GeolocationPosition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const getLocation = () => {
    return new Promise<GeolocationPosition>((resolve, reject) => {
      if (!navigator.geolocation) {
        const errorMsg = 'La geolocalización no está soportada por tu navegador';
        setError(errorMsg);
        reject(new Error(errorMsg));
        return;
      }

      setLoading(true);
      setError(null);
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log("[Geolocation] Posición obtenida:", position.coords.latitude, position.coords.longitude);
          setLocation(position);
          setLoading(false);
          resolve(position);
        },
        (err) => {
          const errorMessages: Record<number, string> = {
            1: "Permiso de ubicación denegado. Por favor, habilita la ubicación en tu navegador.",
            2: "No se pudo obtener la ubicación. Verifica tu conexión o GPS.",
            3: "Se agotó el tiempo para obtener la ubicación. Inténtalo de nuevo."
          };
          
          const errorMsg = errorMessages[err.code] || `Error al obtener la ubicación: ${err.message}`;
          console.warn(errorMsg, err.code);
          setError(errorMsg);
          setLoading(false);
          reject(new Error(errorMsg));
        },
        { 
          enableHighAccuracy: true,
          timeout: 10000, // 10 segundos de timeout
          maximumAge: 60000 // Permitir usar ubicaciones de hasta 1 minuto de antigüedad
        }
      );
    });
  };

  return { location, error, loading, getLocation };
};

export default useGeolocation;
