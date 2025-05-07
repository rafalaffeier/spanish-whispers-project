
import React, { useMemo } from 'react';
import { TimesheetEntry } from '@/types/timesheet';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow,
  TableFooter
} from '@/components/ui/table';
import { format, parse } from 'date-fns';
import { es } from 'date-fns/locale';

interface MonthlyTimesheetViewProps {
  timesheets: TimesheetEntry[];
}

// Nombres de los meses en español
const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const MonthlyTimesheetView: React.FC<MonthlyTimesheetViewProps> = ({ timesheets }) => {
  // Agrupar timesheets por mes y calcular horas totales
  const monthlyTotals = useMemo(() => {
    const totals: { [month: string]: number } = {};
    
    // Inicializar todos los meses con cero para asegurar que aparezcan en el resultado
    MONTHS.forEach(month => {
      totals[month] = 0;
    });
    
    // Calcular horas por mes
    timesheets.forEach(timesheet => {
      if (!timesheet.startTime || !timesheet.endTime) return;
      
      try {
        // Obtener el mes del registro
        const date = new Date(timesheet.date);
        const monthName = MONTHS[date.getMonth()];
        
        // Calcular duración
        let duration = 0;
        const start = new Date(timesheet.startTime).getTime();
        const end = new Date(timesheet.endTime).getTime();
        
        // Calcular tiempo en pausa
        let pausedTime = 0;
        timesheet.pauses?.forEach(pause => {
          if (pause.startTime && pause.endTime) {
            const pauseStart = new Date(pause.startTime).getTime();
            const pauseEnd = new Date(pause.endTime).getTime();
            pausedTime += pauseEnd - pauseStart;
          }
        });
        
        // Calcular tiempo trabajado en segundos
        duration = (end - start - pausedTime) / 1000;
        
        // Sumar al total mensual
        if (!isNaN(duration) && duration > 0) {
          totals[monthName] = (totals[monthName] || 0) + duration;
        }
      } catch (err) {
        console.error('Error al procesar timesheet:', err);
      }
    });
    
    return totals;
  }, [timesheets]);
  
  // Calcular el total anual
  const yearlyTotal = useMemo(() => {
    return Object.values(monthlyTotals).reduce((sum, seconds) => sum + seconds, 0);
  }, [monthlyTotals]);
  
  // Función para formatear segundos a formato HH:MM:SS
  const formatSecondsToTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Si no hay datos, mostrar mensaje
  if (timesheets.length === 0) {
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
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold text-center">Total de horas este año</h3>
      </div>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">Mes</TableHead>
            <TableHead className="text-right">Horas</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {MONTHS.map(month => (
            <TableRow key={month}>
              <TableCell className="font-medium">{month}</TableCell>
              <TableCell className="text-right">{formatSecondsToTime(monthlyTotals[month])}</TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell className="font-medium">Total de horas este año</TableCell>
            <TableCell className="text-right font-bold">{formatSecondsToTime(yearlyTotal)}</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
};

export default MonthlyTimesheetView;
