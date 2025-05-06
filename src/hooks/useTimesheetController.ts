
import { useState, useEffect } from 'react';
import { useGeolocation } from '@/hooks/useGeolocation';
import { toast } from "@/hooks/use-toast";
import { TimesheetEntry, TimesheetStatus, PauseRecord } from '@/types/timesheet';
import * as api from '@/services/api';

interface UseTimesheetControllerProps {
  employee: { id: string; name: string; role: string };
  onUpdate: (timesheet: TimesheetEntry) => void;
  existingTimesheet?: TimesheetEntry;
}

export const useTimesheetController = ({ 
  employee, 
  onUpdate, 
  existingTimesheet 
}: UseTimesheetControllerProps) => {
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
      pauses: [],
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
  const [pauseDialogOpen, setPauseDialogOpen] = useState(false);
  const [pauseReason, setPauseReason] = useState('');
  const { location, getLocation } = useGeolocation();

  // Calcular tiempo transcurrido
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
      
      // Si está en pausa, no incrementar el tiempo
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
    try {
      await getLocation();
      
      // Llamar a la API para iniciar jornada
      const updatedTimesheet = await api.startTimesheet(employee.id, location);
      
      setTimesheet(updatedTimesheet);
      onUpdate(updatedTimesheet);
      
      toast({
        title: "Jornada iniciada",
        description: "Has iniciado tu jornada laboral correctamente.",
      });
    } catch (error) {
      console.error("Error starting timesheet:", error);
      toast({
        title: "Error",
        description: "No se pudo iniciar la jornada.",
        variant: "destructive"
      });
    }
  };

  const pauseDay = () => {
    setPauseDialogOpen(true);
  };

  const handlePauseConfirm = async () => {
    if (!pauseReason.trim()) {
      toast({
        title: "Error",
        description: "Debes ingresar un motivo para la pausa.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      if (!timesheet.id) {
        throw new Error("ID de jornada no disponible");
      }
      
      // Llamar a la API para pausar jornada
      await api.pauseTimesheet(timesheet.id, pauseReason, location);
      
      // Obtener la jornada actualizada
      const updatedTimesheet = await api.getTimesheet(timesheet.id);
      
      setTimesheet(updatedTimesheet);
      onUpdate(updatedTimesheet);
      
      setPauseDialogOpen(false);
      setPauseReason('');
      
      toast({
        title: "Jornada pausada",
        description: "Tu jornada está ahora en pausa.",
      });
    } catch (error) {
      console.error("Error pausing timesheet:", error);
      toast({
        title: "Error",
        description: "No se pudo pausar la jornada.",
        variant: "destructive"
      });
    }
  };

  const resumeDay = async () => {
    try {
      if (!timesheet.id) {
        throw new Error("ID de jornada no disponible");
      }
      
      // Llamar a la API para reanudar jornada
      await api.resumeTimesheet(timesheet.id, location);
      
      // Obtener la jornada actualizada
      const updatedTimesheet = await api.getTimesheet(timesheet.id);
      
      setTimesheet(updatedTimesheet);
      onUpdate(updatedTimesheet);
      
      toast({
        title: "Jornada reanudada",
        description: "Has reanudado tu jornada laboral.",
      });
    } catch (error) {
      console.error("Error resuming timesheet:", error);
      toast({
        title: "Error",
        description: "No se pudo reanudar la jornada.",
        variant: "destructive"
      });
    }
  };

  const endDay = async () => {
    try {
      await getLocation();
      
      if (!timesheet.id) {
        throw new Error("ID de jornada no disponible");
      }
      
      // Primero cambiamos el estado localmente para mejor UX
      const preliminaryUpdate = {
        ...timesheet,
        status: 'finished' as TimesheetStatus
      };
      
      setTimesheet(preliminaryUpdate);
      
      // Abrir diálogo para firma
      setSignatureDialogOpen(true);
    } catch (error) {
      console.error("Error preparing to end timesheet:", error);
      toast({
        title: "Error",
        description: "No se pudo preparar la finalización de jornada.",
        variant: "destructive"
      });
    }
  };

  const handleSignatureSave = async (signatureData: string) => {
    try {
      if (!timesheet.id) {
        throw new Error("ID de jornada no disponible");
      }
      
      // Llamar a la API para finalizar jornada
      await api.endTimesheet(timesheet.id, signatureData, location);
      
      // Obtener la jornada actualizada
      const updatedTimesheet = await api.getTimesheet(timesheet.id);
      
      setTimesheet(updatedTimesheet);
      onUpdate(updatedTimesheet);
      setSignatureDialogOpen(false);
      
      toast({
        title: "Jornada finalizada",
        description: "Has finalizado tu jornada laboral correctamente.",
      });
    } catch (error) {
      console.error("Error ending timesheet:", error);
      toast({
        title: "Error",
        description: "No se pudo finalizar la jornada.",
        variant: "destructive"
      });
    }
  };

  const cancelPause = () => {
    setPauseDialogOpen(false);
    setPauseReason('');
  };

  return {
    timesheet,
    elapsedTime,
    signatureDialogOpen,
    setSignatureDialogOpen,
    pauseDialogOpen,
    setPauseDialogOpen,
    pauseReason,
    setPauseReason,
    startDay,
    pauseDay,
    resumeDay,
    endDay,
    handleSignatureSave,
    handlePauseConfirm,
    cancelPause
  };
};
