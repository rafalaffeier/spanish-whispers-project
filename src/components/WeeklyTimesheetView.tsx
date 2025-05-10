import React, { useMemo } from 'react';
import { TimesheetEntry, PauseRecord } from '@/types/timesheet';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Clock, MapPin } from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from './ui/button';
import { ensureDate } from '@/utils/dateUtils';

interface WeeklyTimesheetViewProps {
  timesheets: TimesheetEntry[];
}

// Helper function to group timesheets by date
const groupTimesheetsByDate = (timesheets: TimesheetEntry[]) => {
  const groupedData: { [date: string]: TimesheetEntry[] } = {};
  
  // Sort timesheets by date in descending order
  const sortedTimesheets = [...timesheets].sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
  
  sortedTimesheets.forEach(timesheet => {
    if (!groupedData[timesheet.date]) {
      groupedData[timesheet.date] = [];
    }
    
    // Add entry for start time
    if (timesheet.startTime) {
      const startEntry: TimesheetEntry = {
        ...timesheet,
        recordType: 'Entrada',
        incidencia: 'Entrada'
      };
      groupedData[timesheet.date].push(startEntry);
    }
    
    // Add entries for pauses
    timesheet.pauses?.forEach(pause => {
      const pauseEntry: TimesheetEntry = {
        ...timesheet,
        recordType: 'Pausa',
        startTime: new Date(pause.startTime),
        endTime: pause.endTime,
        incidencia: pause.reason
      };
      groupedData[timesheet.date].push(pauseEntry);
    });
    
    // Add entry for end time
    if (timesheet.endTime) {
      const endEntry: TimesheetEntry = {
        ...timesheet,
        recordType: 'Salida',
        incidencia: 'Salida'
      };
      groupedData[timesheet.date].push(endEntry);
    }
  });
  
  return groupedData;
};

// Helper to calculate total hours
const calculateTotalHours = (timesheet: TimesheetEntry): string => {
  if (!timesheet.startTime || !timesheet.endTime) return '00:00:00';
  
  // Calculate total time
  const start = new Date(timesheet.startTime).getTime();
  const end = new Date(timesheet.endTime).getTime();
  
  // Calculate paused time
  let pausedTime = 0;
  timesheet.pauses?.forEach(pause => {
    if (pause.startTime && pause.endTime) {
      const pauseStart = new Date(pause.startTime).getTime();
      const pauseEnd = new Date(pause.endTime).getTime();
      pausedTime += pauseEnd - pauseStart;
    }
  });
  
  // Calculate total working time
  const totalMs = end - start - pausedTime;
  
  // Format to HH:MM:SS
  const totalSec = Math.floor(totalMs / 1000);
  const hours = Math.floor(totalSec / 3600).toString().padStart(2, '0');
  const minutes = Math.floor((totalSec % 3600) / 60).toString().padStart(2, '0');
  const seconds = Math.floor(totalSec % 60).toString().padStart(2, '0');
  
  return `${hours}:${minutes}:${seconds}`;
};

// Helper to format date
const formatDate = (dateStr: string): string => {
  try {
    const date = parseISO(dateStr);
    if (!isValid(date)) return dateStr;
    return format(date, 'dd-MM-yyyy', { locale: es });
  } catch (e) {
    return dateStr;
  }
};

// Helper to format time
const formatTime = (date: Date | string | null): string => {
  if (!date) return '--:--:--';
  try {
    return format(ensureDate(date) || new Date(), 'HH:mm:ss');
  } catch (e) {
    return '--:--:--';
  }
};

// Helper to get background color based on record type
const getRecordTypeStyle = (recordType?: string) => {
  switch(recordType) {
    case 'Entrada':
      return 'bg-green-100 text-green-800';
    case 'Pausa':
      return 'bg-red-100 text-red-800';
    case 'Salida':
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

// Helper to get record ID
const getRecordId = (timesheet: TimesheetEntry, index: number): string => {
  return `#${timesheet.id.slice(-4)}`;
};

const WeeklyTimesheetView: React.FC<WeeklyTimesheetViewProps> = ({ timesheets }) => {
  // Group timesheets by date
  const groupedTimesheets = useMemo(() => {
    return groupTimesheetsByDate(timesheets);
  }, [timesheets]);
  
  // If no data, show empty state
  if (Object.keys(groupedTimesheets).length === 0) {
    return (
      <div className="p-6 text-center">
        <div className="w-full py-8 px-4 border border-dashed rounded-lg">
          <p className="text-gray-500">Sin datos</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow">
      {Object.entries(groupedTimesheets).map(([date, entries], dateIndex) => {
        // Check if this date has a complete timesheet (with start and end)
        const completeTimesheet = entries.find(e => e.status === 'finished');
        const totalHours = completeTimesheet ? calculateTotalHours(completeTimesheet) : '';
        
        return (
          <div key={date} className="mb-6 relative">
            {/* Vertical line */}
            <div className="absolute left-6 top-10 bottom-0 w-0.5 bg-gray-200"></div>
            
            {/* Date indicator with circle */}
            <div className="flex items-center mb-2">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mr-4 z-10 border-2 border-white">
                <Clock className="h-6 w-6 text-blue-500" />
              </div>
              <h3 className="text-lg font-semibold text-blue-600">{formatDate(date)}</h3>
            </div>
            
            {/* Table for this date */}
            <div className="ml-16 border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px]"></TableHead>
                    <TableHead className="w-[80px]">#</TableHead>
                    <TableHead className="w-[120px]">Tipo</TableHead>
                    <TableHead className="w-[150px]">Incidencia</TableHead>
                    <TableHead className="w-[120px]">Hora</TableHead>
                    <TableHead className="text-right">Lugar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.length > 0 ? (
                    entries.map((entry, index) => {
                      const timeToShow = entry.recordType === 'Entrada' ? 
                        entry.startTime : entry.recordType === 'Salida' ? 
                        entry.endTime : entry.startTime;
                      
                      const hasLocation = entry.recordType === 'Entrada' ? 
                        entry.location?.startLocation : entry.recordType === 'Salida' ? 
                        entry.location?.endLocation : null;
                      
                      return (
                        <TableRow key={`${entry.id}-${entry.recordType}-${index}`}>
                          <TableCell>
                            <div className="w-6 h-6 rounded border border-gray-300"></div>
                          </TableCell>
                          <TableCell>{getRecordId(entry, index)}</TableCell>
                          <TableCell>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRecordTypeStyle(entry.recordType)}`}>
                              {entry.recordType || '--'}
                            </span>
                          </TableCell>
                          <TableCell className="text-blue-600">
                            {entry.incidencia || '--'}
                          </TableCell>
                          <TableCell>
                            {formatTime(timeToShow)}
                          </TableCell>
                          <TableCell className="text-right">
                            {hasLocation && (
                              <Button variant="ghost" size="sm" className="text-gray-500">
                                <MapPin className="h-4 w-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6">
                        <p className="text-gray-500">Sin datos</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              
              {/* Total hours and signature */}
              {completeTimesheet && (
                <div className="flex justify-between px-4 py-2 bg-gray-50 border-t">
                  <p className="font-medium">
                    Total de horas trabajadas hoy: <span className="text-blue-600">{totalHours} horas</span>
                  </p>
                  {completeTimesheet.signature && (
                    <p className="text-green-600 font-medium">Jornada firmada</p>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default WeeklyTimesheetView;
