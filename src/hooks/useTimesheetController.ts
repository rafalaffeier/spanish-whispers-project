
import { useState, useEffect } from 'react';
import { useGeolocation } from '@/hooks/useGeolocation';
import { toast } from "@/hooks/use-toast";
import { TimesheetEntry, TimesheetStatus, PauseRecord } from '@/types/timesheet';

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

  // Calculate elapsed time
  useEffect(() => {
    let intervalId: number;
    
    const calculateElapsedTime = () => {
      if (!timesheet.startTime) return '00:00:00';
      
      let totalPausedTime = 0;
      
      // Calculate paused time
      for (let i = 0; i < timesheet.pauseTime.length; i++) {
        const pauseStart = new Date(timesheet.pauseTime[i]).getTime();
        const pauseEnd = timesheet.resumeTime[i] 
          ? new Date(timesheet.resumeTime[i]).getTime() 
          : Date.now();
        
        totalPausedTime += pauseEnd - pauseStart;
      }
      
      // Calculate total time
      const start = new Date(timesheet.startTime).getTime();
      const end = timesheet.endTime 
        ? new Date(timesheet.endTime).getTime() 
        : Date.now();
      
      let totalMs = end - start - totalPausedTime;
      
      // If currently paused, don't increment time
      if (timesheet.status === 'paused') {
        const lastPauseStart = new Date(timesheet.pauseTime[timesheet.pauseTime.length - 1]).getTime();
        totalMs = lastPauseStart - start - totalPausedTime;
      }
      
      if (totalMs < 0) totalMs = 0;
      
      // Format to HH:MM:SS
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
    setPauseDialogOpen(true);
  };

  const handlePauseConfirm = () => {
    if (!pauseReason.trim()) {
      toast({
        title: "Error",
        description: "Debes ingresar un motivo para la pausa.",
        variant: "destructive"
      });
      return;
    }
    
    const now = new Date();
    const newPause: PauseRecord = {
      startTime: now,
      endTime: null,
      reason: pauseReason
    };
    
    const updatedTimesheet = {
      ...timesheet,
      pauseTime: [...timesheet.pauseTime, now],
      pauses: [...timesheet.pauses, newPause],
      status: 'paused' as TimesheetStatus
    };
    
    setTimesheet(updatedTimesheet);
    onUpdate(updatedTimesheet);
    setPauseDialogOpen(false);
    setPauseReason('');
    
    toast({
      title: "Jornada pausada",
      description: "Tu jornada está ahora en pausa.",
    });
  };

  const resumeDay = () => {
    const now = new Date();
    const updatedPauses = [...timesheet.pauses];
    // Update the last pause with the end time
    if (updatedPauses.length > 0) {
      const lastPauseIndex = updatedPauses.length - 1;
      updatedPauses[lastPauseIndex] = {
        ...updatedPauses[lastPauseIndex],
        endTime: now
      };
    }
    
    const updatedTimesheet = {
      ...timesheet,
      resumeTime: [...timesheet.resumeTime, now],
      pauses: updatedPauses,
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
    
    // If was paused, add resume time and update the last pause
    if (timesheet.status === 'paused' && timesheet.pauseTime.length > timesheet.resumeTime.length) {
      const now = new Date();
      updatedTimesheet.resumeTime = [...timesheet.resumeTime, now];
      
      // Update the last pause with end time
      if (updatedTimesheet.pauses.length > 0) {
        const lastPauseIndex = updatedTimesheet.pauses.length - 1;
        updatedTimesheet.pauses[lastPauseIndex] = {
          ...updatedTimesheet.pauses[lastPauseIndex],
          endTime: now
        };
      }
    }
    
    updatedTimesheet.endTime = new Date();
    updatedTimesheet.location = {
      ...timesheet.location,
      endLocation: location
    };
    
    setTimesheet(updatedTimesheet);
    onUpdate(updatedTimesheet);
    
    // Open signature dialog
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
