
import React from 'react';
import { TimesheetEntry } from '@/types/timesheet';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Signature } from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';

interface TimesheetTableProps {
  timesheets: TimesheetEntry[];
}

const TimesheetTable: React.FC<TimesheetTableProps> = ({ timesheets }) => {
  const formatTime = (date: Date | null) => {
    if (!date) return '---';
    return new Date(date).toLocaleTimeString();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Activa</Badge>;
      case 'paused':
        return <Badge className="bg-yellow-500">Pausada</Badge>;
      case 'finished':
        return <Badge className="bg-blue-500">Finalizada</Badge>;
      default:
        return <Badge className="bg-gray-500">No iniciada</Badge>;
    }
  };

  // Calcular la duración de la jornada
  const calculateDuration = (timesheet: TimesheetEntry) => {
    if (!timesheet.startTime) return '---';
    
    let totalPausedTime = 0;
    
    // Calcular tiempo en pausa
    for (let i = 0; i < timesheet.pauseTime.length; i++) {
      const pauseStart = new Date(timesheet.pauseTime[i]).getTime();
      const pauseEnd = timesheet.resumeTime[i] 
        ? new Date(timesheet.resumeTime[i]).getTime() 
        : (timesheet.status === 'paused' ? Date.now() : 0);
      
      if (pauseEnd > 0) {
        totalPausedTime += pauseEnd - pauseStart;
      }
    }
    
    // Calcular tiempo total
    const start = new Date(timesheet.startTime).getTime();
    const end = timesheet.endTime 
      ? new Date(timesheet.endTime).getTime() 
      : (timesheet.status !== 'finished' ? Date.now() : start);
    
    let totalMs = end - start - totalPausedTime;
    if (totalMs < 0) totalMs = 0;
    
    // Formatear a HH:MM:SS
    const totalSec = Math.floor(totalMs / 1000);
    const hours = Math.floor(totalSec / 3600).toString().padStart(2, '0');
    const minutes = Math.floor((totalSec % 3600) / 60).toString().padStart(2, '0');
    
    return `${hours}h ${minutes}m`;
  };

  if (timesheets.length === 0) {
    return <div className="text-center py-8">No hay registros para mostrar</div>;
  }

  return (
    <Table>
      <TableCaption>Registros de jornadas laborales</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Empleado</TableHead>
          <TableHead>Fecha</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead>Hora inicio</TableHead>
          <TableHead>Hora fin</TableHead>
          <TableHead>Duración</TableHead>
          <TableHead>Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {timesheets.map((timesheet) => (
          <TableRow key={timesheet.id}>
            <TableCell className="font-medium">{timesheet.employeeName}</TableCell>
            <TableCell>{timesheet.date}</TableCell>
            <TableCell>{getStatusBadge(timesheet.status)}</TableCell>
            <TableCell>{formatTime(timesheet.startTime)}</TableCell>
            <TableCell>{formatTime(timesheet.endTime)}</TableCell>
            <TableCell>{calculateDuration(timesheet)}</TableCell>
            <TableCell>
              <div className="flex space-x-2">
                {/* Diálogo para ver ubicación */}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <MapPin className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Ubicaciones</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      {timesheet.location.startLocation && (
                        <div>
                          <h4 className="font-semibold">Inicio:</h4>
                          <p>Latitud: {timesheet.location.startLocation.coords.latitude.toFixed(6)}</p>
                          <p>Longitud: {timesheet.location.startLocation.coords.longitude.toFixed(6)}</p>
                          <a
                            href={`https://www.google.com/maps?q=${timesheet.location.startLocation.coords.latitude},${timesheet.location.startLocation.coords.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline"
                          >
                            Ver en Google Maps
                          </a>
                        </div>
                      )}
                      
                      {timesheet.location.endLocation && (
                        <div>
                          <h4 className="font-semibold">Fin:</h4>
                          <p>Latitud: {timesheet.location.endLocation.coords.latitude.toFixed(6)}</p>
                          <p>Longitud: {timesheet.location.endLocation.coords.longitude.toFixed(6)}</p>
                          <a
                            href={`https://www.google.com/maps?q=${timesheet.location.endLocation.coords.latitude},${timesheet.location.endLocation.coords.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline"
                          >
                            Ver en Google Maps
                          </a>
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
                
                {/* Diálogo para ver firma */}
                {timesheet.signature && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Signature className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Firma del empleado</DialogTitle>
                      </DialogHeader>
                      <div className="flex justify-center">
                        <img 
                          src={timesheet.signature} 
                          alt="Firma del empleado" 
                          className="border border-gray-200 rounded"
                        />
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default TimesheetTable;
