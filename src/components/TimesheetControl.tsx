
import React from 'react';
import { TimesheetEntry } from '@/types/timesheet';
import { useTimesheetController } from '@/hooks/useTimesheetController';
import TimesheetActions from '@/components/timesheet/TimesheetActions';
import TimesheetInfo from '@/components/timesheet/TimesheetInfo';
import TimesheetSignatureDialog from '@/components/timesheet/TimesheetSignatureDialog';
import PauseDialog from '@/components/timesheet/PauseDialog';
import PausesList from '@/components/timesheet/PausesList';

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
        
        {/* Show pauses list if there are any */}
        {timesheet.pauses && timesheet.pauses.length > 0 && (
          <PausesList pauses={timesheet.pauses} />
        )}
      </div>

      <TimesheetSignatureDialog 
        open={signatureDialogOpen}
        onOpenChange={setSignatureDialogOpen}
        onSave={handleSignatureSave}
      />
      
      <PauseDialog
        open={pauseDialogOpen}
        onOpenChange={setPauseDialogOpen}
        reason={pauseReason}
        onReasonChange={setPauseReason}
        onConfirm={handlePauseConfirm}
        onCancel={cancelPause}
      />
    </>
  );
};

export default TimesheetControl;
