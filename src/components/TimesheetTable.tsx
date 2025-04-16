
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
import { MapPin, Signature, Clock, Calendar } from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { format } from 'date-fns';

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
    return (
      <div className="p-6 text-center">
        <div className="w-full py-8 px-4 border border-dashed rounded-lg">
          <p className="text-gray-500">Sin datos</p>
        </div>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[40px]"></TableHead>
          <TableHead className="w-[50px]">#</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead>Incidencia</TableHead>
          <TableHead>Hora</TableHead>
          <TableHead>Lugar</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {timesheets.map((timesheet, index) => (
          <TableRow key={timesheet.id}>
            <TableCell>
              <Clock className="h-5 w-5 text-gray-400" />
            </TableCell>
            <TableCell>{index + 1}</TableCell>
            <TableCell>{timesheet.tipo || getStatusBadge(timesheet.status)}</TableCell>
            <TableCell>{timesheet.incidencia || "---"}</TableCell>
            <TableCell>
              {timesheet.startTime && formatTime(timesheet.startTime)}
              {timesheet.endTime && ` - ${formatTime(timesheet.endTime)}`}
              {(!timesheet.startTime && !timesheet.endTime) && "---"}
            </TableCell>
            <TableCell>{timesheet.lugar || "---"}</TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end space-x-2">
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
