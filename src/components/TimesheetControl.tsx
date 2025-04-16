
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Play, Pause, StopCircle, MapPin, Clock, User } from 'lucide-react';
import { useGeolocation } from '@/hooks/useGeolocation';
import SignatureCanvas from '@/components/SignatureCanvas';
import { TimesheetEntry, TimesheetStatus } from '@/types/timesheet';
import { toast } from "@/hooks/use-toast";

interface TimesheetControlProps {
  employee: { id: string; name: string; role: string };
  onUpdate: (timesheet: TimesheetEntry) => void;
  existingTimesheet?: TimesheetEntry;
}

const TimesheetControl: React.FC<TimesheetControlProps> = ({ employee, onUpdate, existingTimesheet }) => {
  const [timesheet, setTimesheet] = useState<TimesheetEntry>(() => {
    const today = new Date().toISOString().split('T')[0];
    
    return existingTimesheet || {
      id: crypto.randomUUID(),
      employeeId: employee.id,
      employeeName: employee.name,
      startTime: null,
      pauseTime: [],
      resumeTime: [],
      endTime: null,
      signature: null,
      location: {
        startLocation: null,
        endLocation: null
      },
      status: "not_started" as TimesheetStatus,
      date: today
    };
  });
  const [elapsedTime, setElapsedTime] = useState<string>('00:00:00');
  const [signatureDialogOpen, setSignatureDialogOpen] = useState(false);
  const { location, getLocation } = useGeolocation();

  // Función para calcular el tiempo transcurrido
  useEffect(() => {
    let intervalId: number;
    
    const calculateElapsedTime = () => {
      if (!timesheet.startTime) return '00:00:00';
      
      let totalPausedTime = 0;
      
      // Calcular tiempo en pausa
      for (let i = 0; i < timesheet.pauseTime.length; i++) {
        const pauseStart = new Date(timesheet.pauseTime[i]).getTime();
        const pauseEnd = timesheet.resumeTime[i] 
          ? new Date(timesheet.resumeTime[i]).getTime() 
          : Date.now();
        
        totalPausedTime += pauseEnd - pauseStart;
      }
      
      // Calcular tiempo total
      const start = new Date(timesheet.startTime).getTime();
      const end = timesheet.endTime 
        ? new Date(timesheet.endTime).getTime() 
        : Date.now();
      
      let totalMs = end - start - totalPausedTime;
      
      // Si está en pausa actualmente, no incrementar el tiempo
      if (timesheet.status === 'paused') {
        const lastPauseStart = new Date(timesheet.pauseTime[timesheet.pauseTime.length - 1]).getTime();
        totalMs = lastPauseStart - start - totalPausedTime;
      }
      
      if (totalMs < 0) totalMs = 0;
      
      // Formatear a HH:MM:SS
      const totalSec = Math.floor(totalMs / 1000);
      const hours = Math.floor(totalSec / 3600).toString().padStart(2, '0');
      const minutes = Math.floor((totalSec % 3600) / 60).toString().padStart(2, '0');
      const seconds = Math.floor(totalSec % 60).toString().padStart(2, '0');
      
      return `${hours}:${minutes}:${seconds}`;
    };
    
    if (timesheet.status === 'active' || timesheet.status === 'paused') {
      setElapsedTime(calculateElapsedTime());
      
      if (timesheet.status === 'active') {
        intervalId = window.setInterval(() => {
          setElapsedTime(calculateElapsedTime());
        }, 1000);
      }
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [timesheet]);

  const startDay = async () => {
    await getLocation();
    
    const updatedTimesheet = {
      ...timesheet,
      startTime: new Date(),
      status: 'active' as TimesheetStatus,
      location: {
        ...timesheet.location,
        startLocation: location
      }
    };
    
    setTimesheet(updatedTimesheet);
    onUpdate(updatedTimesheet);
    toast({
      title: "Jornada iniciada",
      description: "Has iniciado tu jornada laboral correctamente.",
    });
  };

  const pauseDay = () => {
    const updatedTimesheet = {
      ...timesheet,
      pauseTime: [...timesheet.pauseTime, new Date()],
      status: 'paused' as TimesheetStatus
    };
    
    setTimesheet(updatedTimesheet);
    onUpdate(updatedTimesheet);
    toast({
      title: "Jornada pausada",
      description: "Tu jornada está ahora en pausa.",
    });
  };

  const resumeDay = () => {
    const updatedTimesheet = {
      ...timesheet,
      resumeTime: [...timesheet.resumeTime, new Date()],
      status: 'active' as TimesheetStatus
    };
    
    setTimesheet(updatedTimesheet);
    onUpdate(updatedTimesheet);
    toast({
      title: "Jornada reanudada",
      description: "Has reanudado tu jornada laboral.",
    });
  };

  const endDay = async () => {
    await getLocation();
    
    const updatedTimesheet = {
      ...timesheet,
      status: 'finished' as TimesheetStatus
    };
    
    // Si estaba en pausa, añadir tiempo de reanudación
    if (timesheet.status === 'paused' && timesheet.pauseTime.length > timesheet.resumeTime.length) {
      updatedTimesheet.resumeTime = [...timesheet.resumeTime, new Date()];
    }
    
    updatedTimesheet.endTime = new Date();
    updatedTimesheet.location = {
      ...timesheet.location,
      endLocation: location
    };
    
    setTimesheet(updatedTimesheet);
    onUpdate(updatedTimesheet);
    
    // Abrir diálogo para firma
    setSignatureDialogOpen(true);
  };

  const handleSignatureSave = (signatureData: string) => {
    const updatedTimesheet = {
      ...timesheet,
      signature: signatureData
    };
    
    setTimesheet(updatedTimesheet);
    onUpdate(updatedTimesheet);
    setSignatureDialogOpen(false);
    
    toast({
      title: "Jornada finalizada",
      description: "Has finalizado tu jornada laboral correctamente.",
    });
  };

  // Determinar qué botones mostrar según el estado
  const renderActionButtons = () => {
    switch (timesheet.status) {
      case 'not_started':
        return (
          <Button onClick={startDay} className="w-full">
            <Play className="mr-2 h-4 w-4" />
            Iniciar Jornada
          </Button>
        );
      case 'active':
        return (
          <div className="grid grid-cols-2 gap-2 w-full">
            <Button onClick={pauseDay} variant="outline">
              <Pause className="mr-2 h-4 w-4" />
              Pausar
            </Button>
            <Button onClick={endDay} variant="destructive">
              <StopCircle className="mr-2 h-4 w-4" />
              Finalizar
            </Button>
          </div>
        );
      case 'paused':
        return (
          <div className="grid grid-cols-2 gap-2 w-full">
            <Button onClick={resumeDay} variant="outline">
              <Play className="mr-2 h-4 w-4" />
              Reanudar
            </Button>
            <Button onClick={endDay} variant="destructive">
              <StopCircle className="mr-2 h-4 w-4" />
              Finalizar
            </Button>
          </div>
        );
      case 'finished':
        return (
          <Button disabled className="w-full">
            Jornada Finalizada
          </Button>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Control de Jornada</span>
            <span className="text-lg font-mono">{elapsedTime}</span>
          </CardTitle>
          <CardDescription>
            <div className="flex items-center mt-1">
              <User className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>{employee.name} - {employee.role}</span>
            </div>
            <div className="flex items-center mt-1">
              <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>
                {timesheet.startTime
                  ? `Inicio: ${new Date(timesheet.startTime).toLocaleTimeString()}`
                  : 'Jornada no iniciada'}
              </span>
            </div>
            {timesheet.startTime && timesheet.location.startLocation && (
              <div className="flex items-center mt-1">
                <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>
                  Ubicación: {timesheet.location.startLocation.coords.latitude.toFixed(6)}, 
                  {timesheet.location.startLocation.coords.longitude.toFixed(6)}
                </span>
              </div>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {timesheet.status === 'active' && (
              <div className="rounded-lg bg-green-100 dark:bg-green-900/20 p-3 text-center">
                <span className="text-green-800 dark:text-green-400 font-medium">Jornada activa</span>
              </div>
            )}
            {timesheet.status === 'paused' && (
              <div className="rounded-lg bg-amber-100 dark:bg-amber-900/20 p-3 text-center">
                <span className="text-amber-800 dark:text-amber-400 font-medium">Jornada en pausa</span>
              </div>
            )}
            {timesheet.status === 'finished' && (
              <div className="rounded-lg bg-blue-100 dark:bg-blue-900/20 p-3 text-center">
                <span className="text-blue-800 dark:text-blue-400 font-medium">Jornada finalizada</span>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter>
          {renderActionButtons()}
        </CardFooter>
      </Card>

      <Dialog open={signatureDialogOpen} onOpenChange={setSignatureDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Firma para finalizar tu jornada</DialogTitle>
            <DialogDescription>
              Por favor, firma en el área a continuación para confirmar el fin de tu jornada.
            </DialogDescription>
          </DialogHeader>
          <SignatureCanvas onSave={handleSignatureSave} />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TimesheetControl;
