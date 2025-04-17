
import React from 'react';
import { PauseRecord } from '@/types/timesheet';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PauseCircle } from 'lucide-react';

interface PausesListProps {
  pauses: PauseRecord[];
}

const PausesList: React.FC<PausesListProps> = ({ pauses }) => {
  if (pauses.length === 0) return null;
  
  return (
    <div className="mt-4">
      <h3 className="text-md font-medium text-gray-700 mb-2">Pausas registradas:</h3>
      <div className="space-y-2">
        {pauses.map((pause, index) => {
          const startTime = format(new Date(pause.startTime), 'HH:mm:ss');
          const endTime = pause.endTime 
            ? format(new Date(pause.endTime), 'HH:mm:ss')
            : 'En curso';
            
          return (
            <Card key={index} className="bg-gray-50 border-gray-200">
              <CardContent className="p-3">
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    <PauseCircle className="h-5 w-5 text-rose-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-700">
                      Desde las <span className="font-medium">{startTime}</span> hasta las <span className="font-medium">{endTime}</span>
                    </p>
                    <p className="text-sm font-medium text-gray-900 mt-1">{pause.reason}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default PausesList;
