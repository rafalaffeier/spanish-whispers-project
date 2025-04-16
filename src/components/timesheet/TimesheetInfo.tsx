
import React from 'react';

interface TimesheetInfoProps {
  startTime: Date | null;
  elapsedTime: string;
}

const TimesheetInfo: React.FC<TimesheetInfoProps> = ({ 
  startTime, 
  elapsedTime 
}) => {
  if (!startTime) return null;
  
  const formattedStartTime = new Date(startTime).toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit'
  });
  
  return (
    <div className="mt-4 space-y-1">
      <p className="text-gray-700 text-lg">Comienzo a las: {formattedStartTime}</p>
      <p className="text-gray-700 text-lg">Horas trabajadas : {elapsedTime} hs</p>
    </div>
  );
};

export default TimesheetInfo;
