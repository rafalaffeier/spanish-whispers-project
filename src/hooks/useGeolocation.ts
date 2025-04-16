
import { useState, useEffect } from 'react';

export const useGeolocation = () => {
  const [location, setLocation] = useState<GeolocationPosition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const getLocation = () => {
    if (!navigator.geolocation) {
      setError('La geolocalización no está soportada por tu navegador');
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation(position);
        setLoading(false);
      },
      (err) => {
        setError(`Error al obtener la ubicación: ${err.message}`);
        setLoading(false);
      },
      { enableHighAccuracy: true }
    );
  };

  return { location, error, loading, getLocation };
};
