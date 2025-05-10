
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '@/components/AdminSidebar';
import { Calendar } from '@/components/ui/calendar';
import { useTimesheet } from '@/context/TimesheetContext';
import { Badge } from '@/components/ui/badge';
import { TimesheetStatus } from '@/types/timesheet';
import { Clock, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';

const AdminCalendar = () => {
  const { timesheets, employees } = useTimesheet();
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  
  // Obtener todos los días del mes actual
  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  });
  
  // Función para ir al mes anterior
  const goToPreviousMonth = () => {
    const prevMonth = new Date(currentMonth);
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    setCurrentMonth(prevMonth);
  };
  
  // Función para ir al mes siguiente
  const goToNextMonth = () => {
    const nextMonth = new Date(currentMonth);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    setCurrentMonth(nextMonth);
  };
  
  // Función para formatear mes y año
  const formatMonthAndYear = () => {
    return format(currentMonth, 'MMMM yyyy', { locale: es });
  };
  
  // Función para obtener todas las entradas de timesheet para una fecha específica
  const getTimesheetsForDate = (date: Date) => {
    return timesheets.filter(ts => {
      const tsDate = new Date(ts.date);
      return isSameDay(tsDate, date);
    });
  };

  // Función para crear decoraciones de día en el calendario
  const getDayDecorations = (date: Date) => {
    const dayTimesheets = getTimesheetsForDate(date);
    
    if (dayTimesheets.length === 0) {
      return null;
    }
    
    // Contar los diferentes estados
    const statusCount = {
      finished: 0,
      active: 0,
      paused: 0,
      not_started: 0
    };
    
    dayTimesheets.forEach(ts => {
      statusCount[ts.status]++;
    });
    
    return (
      <div className="flex flex-wrap gap-1 mt-1">
        {statusCount.finished > 0 && (
          <Badge variant="outline" className="bg-green-100 text-green-800 text-[8px] px-1">
            {statusCount.finished}
          </Badge>
        )}
        {statusCount.active > 0 && (
          <Badge variant="outline" className="bg-blue-100 text-blue-800 text-[8px] px-1">
            {statusCount.active}
          </Badge>
        )}
        {statusCount.paused > 0 && (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 text-[8px] px-1">
            {statusCount.paused}
          </Badge>
        )}
      </div>
    );
  };

  // Obtener los registros para la fecha seleccionada
  const selectedDateTimesheets = selectedDate ? getTimesheetsForDate(selectedDate) : [];

  return (
    <div className="flex h-screen w-full bg-gray-50">
      <AdminSidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header superior con título */}
        <header className="bg-[#A4CB6A] text-white py-1 px-4 text-center">
          <h1 className="text-lg font-semibold">APLIUM APLICACIONES TELEMATICAS SL</h1>
        </header>
        
        <main className="flex-1 overflow-auto p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Calendario de Actividad</h1>
            <p className="text-gray-600">Vista de calendario de la actividad de los empleados</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Columna del calendario */}
            <div className="bg-white rounded-lg shadow-sm p-6 md:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold flex items-center">
                  <CalendarIcon className="mr-2 text-[#A4CB6A]" />
                  Calendario
                </h2>
                <div className="flex items-center space-x-2">
                  <button onClick={goToPreviousMonth} className="p-1 rounded hover:bg-gray-100">
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <span className="font-medium">{formatMonthAndYear()}</span>
                  <button onClick={goToNextMonth} className="p-1 rounded hover:bg-gray-100">
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                month={currentMonth}
                onMonthChange={setCurrentMonth}
                className="rounded border"
                components={{
                  DayContent: ({ day }) => (
                    <div className="flex flex-col items-center">
                      <span>{format(day, 'd')}</span>
                      {getDayDecorations(day)}
                    </div>
                  )
                }}
              />
              
              <div className="mt-4 flex justify-center gap-4 text-xs">
                <div className="flex items-center">
                  <div className="h-3 w-3 rounded-full bg-green-100 border border-green-800 mr-1"></div>
                  <span>Completados</span>
                </div>
                <div className="flex items-center">
                  <div className="h-3 w-3 rounded-full bg-blue-100 border border-blue-800 mr-1"></div>
                  <span>En progreso</span>
                </div>
                <div className="flex items-center">
                  <div className="h-3 w-3 rounded-full bg-yellow-100 border border-yellow-800 mr-1"></div>
                  <span>Pausados</span>
                </div>
              </div>
            </div>
            
            {/* Columna de registros del día */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Clock className="mr-2 text-[#A4CB6A]" />
                {selectedDate ? format(selectedDate, "d 'de' MMMM", { locale: es }) : "Seleccione una fecha"}
              </h2>
              
              {selectedDateTimesheets.length > 0 ? (
                <div className="space-y-4">
                  {selectedDateTimesheets.map((timesheet, index) => {
                    const employee = employees.find(e => e.id === timesheet.employeeId);
                    const startTime = timesheet.startTime ? new Date(timesheet.startTime).toLocaleTimeString() : 'No registrado';
                    const endTime = timesheet.endTime ? new Date(timesheet.endTime).toLocaleTimeString() : 'En progreso';
                    
                    return (
                      <div key={index} className="border-b pb-3 last:border-0">
                        <div className="flex justify-between">
                          <div>
                            <p className="font-medium">{employee?.name || 'Empleado desconocido'}</p>
                            <p className="text-sm text-gray-500">
                              {startTime} - {endTime}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className={`inline-block px-2 py-1 rounded text-xs ${
                              timesheet.status === 'finished' ? 'bg-green-100 text-green-800' : 
                              timesheet.status === 'active' ? 'bg-blue-100 text-blue-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {timesheet.status === 'finished' ? 'Completado' : 
                               timesheet.status === 'active' ? 'En progreso' : 'Pausado'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center py-4 text-gray-500">
                  {selectedDate ? "No hay registros para esta fecha" : "Seleccione una fecha para ver los registros"}
                </p>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminCalendar;
