
import React from 'react';
import { TimesheetEntry } from '@/types/timesheet';
import { useTimesheetController } from '@/hooks/useTimesheetController';
import TimesheetActions from '@/components/timesheet/TimesheetActions';
import TimesheetInfo from '@/components/timesheet/TimesheetInfo';
import TimesheetSignatureDialog from '@/components/timesheet/TimesheetSignatureDialog';

interface TimesheetControlProps {
  employee: { id: string; name: string; role: string };
  onUpdate: (timesheet: TimesheetEntry) => void;
  existingTimesheet?: TimesheetEntry;
}

const TimesheetControl: React.FC<TimesheetControlProps> = ({ 
  employee, 
  onUpdate, 
  existingTimesheet 
}) => {
  const {
    timesheet,
    elapsedTime,
    signatureDialogOpen,
    setSignatureDialogOpen,
    startDay,
    pauseDay,
    resumeDay,
    endDay,
    handleSignatureSave
  } = useTimesheetController({
    employee,
    onUpdate,
    existingTimesheet
  });

  return (
    <>
      <div className="space-y-4">
        <TimesheetActions 
          status={timesheet.status}
          onStart={startDay}
          onPause={pauseDay}
          onResume={resumeDay}
          onEnd={endDay}
        />
        
        <TimesheetInfo 
          startTime={timesheet.startTime} 
          elapsedTime={elapsedTime} 
        />
      </div>

      <TimesheetSignatureDialog 
        open={signatureDialogOpen}
        onOpenChange={setSignatureDialogOpen}
        onSave={handleSignatureSave}
      />
    </>
  );
};

export default TimesheetControl;
