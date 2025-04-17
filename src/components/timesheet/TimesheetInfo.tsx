
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
    <div className="mt-6 p-4 bg-gray-50 rounded-xl shadow-sm border border-gray-100">
      <div className="flex flex-col space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-gray-500 font-medium">Hora de inicio:</span>
          <span className="text-gray-800 font-semibold text-lg">{formattedStartTime}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-500 font-medium">Horas trabajadas:</span>
          <span className="text-gray-800 font-semibold text-lg">{elapsedTime} hs</span>
        </div>
      </div>
    </div>
  );
};

export default TimesheetInfo;
