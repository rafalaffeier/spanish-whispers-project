
import React from 'react';
import GoogleMap from './GoogleMap';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Employee } from '@/types/timesheet';
import { MapPin } from 'lucide-react';

interface EmployeeLocationMapProps {
  employee: Employee;
  title?: string;
}

const EmployeeLocationMap: React.FC<EmployeeLocationMapProps> = ({ employee, title }) => {
  // Verificar si tenemos coordenadas para el empleado
  const hasCoordinates = employee.coordinates && 
    typeof employee.coordinates.lat === 'number' && 
    typeof employee.coordinates.lng === 'number';
  
  // Si no hay coordenadas, mostrar un mensaje
  if (!hasCoordinates) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MapPin className="h-5 w-5 mr-2 text-muted-foreground" />
            {title || `Ubicación de ${employee.name}`}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="flex items-center justify-center h-[300px] bg-muted/20 rounded-md">
            <p className="text-muted-foreground text-center">
              No hay datos de ubicación disponibles para este empleado
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Preparar marcador para el empleado
  const marker = {
    position: {
      lat: employee.coordinates.lat,
      lng: employee.coordinates.lng
    },
    title: employee.name
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <MapPin className="h-5 w-5 mr-2 text-muted-foreground" />
          {title || `Ubicación de ${employee.name}`}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-2">
        <GoogleMap 
          center={marker.position}
          zoom={15}
          markers={[marker]}
          height="300px"
          className="rounded-md overflow-hidden"
        />
      </CardContent>
    </Card>
  );
};

export default EmployeeLocationMap;
