
import React, { useEffect } from 'react';
import GoogleMap from './GoogleMap';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Employee } from '@/types/timesheet';
import { Users, MapPin } from 'lucide-react';

interface EmployeesActivityMapProps {
  employees: Employee[];
  title?: string;
  onMapInitialized?: () => void;
}

const EmployeesActivityMap: React.FC<EmployeesActivityMapProps> = ({ 
  employees, 
  title = "Actividad de empleados",
  onMapInitialized
}) => {
  // Filtrar empleados con coordenadas válidas
  const employeesWithLocation = employees.filter(
    emp => emp.coordinates && typeof emp.coordinates.lat === 'number' && typeof emp.coordinates.lng === 'number'
  );

  useEffect(() => {
    if (onMapInitialized) {
      onMapInitialized();
    }
  }, [onMapInitialized]);

  // Verificar si hay empleados con ubicación
  if (employeesWithLocation.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2 text-muted-foreground" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="flex items-center justify-center h-[400px] bg-muted/20 rounded-md">
            <p className="text-muted-foreground text-center">
              No hay datos de ubicación disponibles para los empleados
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Crear marcadores para todos los empleados
  const markers = employeesWithLocation.map(emp => ({
    position: {
      lat: emp.coordinates!.lat,
      lng: emp.coordinates!.lng
    },
    title: emp.name
  }));

  // Calcular el centro del mapa (promedio de todas las ubicaciones)
  const center = calculateMapCenter(employeesWithLocation);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <MapPin className="h-5 w-5 mr-2 text-muted-foreground" />
          {title} ({employeesWithLocation.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-2">
        <GoogleMap 
          center={center}
          zoom={employeesWithLocation.length === 1 ? 15 : 12}
          markers={markers}
          height="400px"
          className="rounded-md overflow-hidden"
          onMapLoaded={onMapInitialized}
        />
      </CardContent>
    </Card>
  );
};

// Función para calcular el centro del mapa basado en las ubicaciones de los empleados
const calculateMapCenter = (employees: Employee[]): { lat: number; lng: number } => {
  if (employees.length === 0) {
    // Default: centro de España
    return { lat: 40.416775, lng: -3.703790 };
  }
  
  if (employees.length === 1 && employees[0].coordinates) {
    return { 
      lat: employees[0].coordinates.lat, 
      lng: employees[0].coordinates.lng 
    };
  }

  // Calcular el promedio de todas las coordenadas
  let totalLat = 0;
  let totalLng = 0;
  let validCoordinates = 0;

  employees.forEach(emp => {
    if (emp.coordinates) {
      totalLat += emp.coordinates.lat;
      totalLng += emp.coordinates.lng;
      validCoordinates++;
    }
  });

  if (validCoordinates === 0) {
    return { lat: 40.416775, lng: -3.703790 };
  }

  return {
    lat: totalLat / validCoordinates,
    lng: totalLng / validCoordinates
  };
};

export default EmployeesActivityMap;
