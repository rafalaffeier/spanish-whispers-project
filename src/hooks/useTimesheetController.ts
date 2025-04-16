
import { useState, useEffect } from 'react';
import { useGeolocation } from '@/hooks/useGeolocation';
import { toast } from "@/hooks/use-toast";
import { TimesheetEntry, TimesheetStatus } from '@/types/timesheet';

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
    
    // If was paused, add resume time
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

  return {
    timesheet,
    elapsedTime,
    signatureDialogOpen,
    setSignatureDialogOpen,
    startDay,
    pauseDay,
    resumeDay,
    endDay,
    handleSignatureSave
  };
};
