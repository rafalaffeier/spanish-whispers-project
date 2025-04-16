
import React from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Briefcase, Clock } from 'lucide-react';
import { TimesheetStatus } from '@/types/timesheet';

interface TimesheetActionsProps {
  status: TimesheetStatus;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onEnd: () => void;
}

const TimesheetActions: React.FC<TimesheetActionsProps> = ({
  status,
  onStart,
  onPause,
  onResume,
  onEnd
}) => {
  switch (status) {
    case 'not_started':
      return (
        <Button 
          onClick={onStart} 
          className="w-full h-20 text-lg bg-green-100 hover:bg-green-200 text-green-800"
        >
          <Clock className="mr-2 h-6 w-6" />
          Comenzar Jornada
        </Button>
      );
    case 'active':
      return (
        <div className="space-y-4 w-full">
          <Button 
            onClick={onPause} 
            className="w-full h-20 text-lg bg-rose-200 hover:bg-rose-300 text-rose-800"
          >
            <Pause className="mr-2 h-6 w-6" />
            Pausa
          </Button>
          <Button 
            onClick={onEnd} 
            className="w-full h-20 text-lg bg-blue-200 hover:bg-blue-300 text-blue-800"
          >
            <Briefcase className="mr-2 h-6 w-6" />
            Finalizar Jornada
          </Button>
        </div>
      );
    case 'paused':
      return (
        <div className="space-y-4 w-full">
          <Button 
            onClick={onResume} 
            className="w-full h-20 text-lg bg-rose-200 hover:bg-rose-300 text-rose-800"
          >
            <Play className="mr-2 h-6 w-6" />
            Reanudar
          </Button>
          <Button 
            onClick={onEnd} 
            className="w-full h-20 text-lg bg-blue-200 hover:bg-blue-300 text-blue-800"
          >
            <Briefcase className="mr-2 h-6 w-6" />
            Finalizar Jornada
          </Button>
        </div>
      );
    case 'finished':
      return (
        <Button 
          disabled 
          className="w-full h-20 text-lg"
        >
          Jornada Finalizada
        </Button>
      );
    default:
      return null;
  }
};

export default TimesheetActions;
