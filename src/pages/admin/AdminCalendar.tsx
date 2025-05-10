
import React, { useState } from 'react';
import { useTimesheet } from '@/context/TimesheetContext';
import AdminSidebar from '@/components/AdminSidebar';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { Calendar } from "@/components/ui/calendar";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';

const AdminCalendar = () => {
  const { timesheets, employees } = useTimesheet();
  const [date, setDate] = useState<Date>(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  
  // Filtrar los registros por el día seleccionado
  const filteredTimesheets = timesheets.filter(timesheet => {
    if (!selectedDay) return false;
    return isSameDay(new Date(timesheet.date), selectedDay);
  });

  // Buscar días con actividad para resaltarlos en el calendario
  const daysWithActivity = eachDayOfInterval({
    start: startOfMonth(date),
    end: endOfMonth(date)
  }).filter(day => 
    timesheets.some(timesheet => 
      isSameDay(new Date(timesheet.date), day)
    )
  );

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
            <h1 className="text-2xl font-bold">Calendario</h1>
            <p className="text-gray-600">Visualización de registros por fecha</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold flex items-center">
                  <CalendarIcon className="mr-2 text-[#A4CB6A]" />
                  {format(date, 'MMMM yyyy', { locale: es })}
                </h2>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => setDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                    className="p-1 rounded-full hover:bg-gray-100"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button 
                    onClick={() => setDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
                    className="p-1 rounded-full hover:bg-gray-100"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              <Calendar
                mode="single"
                selected={selectedDay || undefined}
                onSelect={setSelectedDay}
                month={date}
                onMonthChange={setDate}
                locale={es}
                className="w-full"
                modifiers={{
                  hasActivity: daysWithActivity,
                }}
                modifiersClassNames={{
                  hasActivity: "bg-[#A4CB6A]/20 font-bold text-[#A4CB6A]",
                }}
              />
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">
                Registros del día {selectedDay ? format(selectedDay, 'dd/MM/yyyy') : ''}
              </h2>
              
              {selectedDay ? (
                filteredTimesheets.length > 0 ? (
                  <div className="space-y-4">
                    {filteredTimesheets.map((timesheet, index) => {
                      const employee = employees.find(e => e.id === timesheet.employeeId);
                      const startTime = timesheet.startTime ? new Date(timesheet.startTime).toLocaleTimeString() : 'No registrado';
                      const endTime = timesheet.endTime ? new Date(timesheet.endTime).toLocaleTimeString() : 'En progreso';
                      
                      return (
                        <div key={index} className="border p-3 rounded-md">
                          <div className="flex justify-between">
                            <div>
                              <p className="font-medium">{employee?.name || 'Empleado desconocido'}</p>
                              <p className="text-sm text-gray-500">
                                {startTime} - {endTime}
                              </p>
                            </div>
                            <div className="text-right">
                              <span className={`inline-block px-2 py-1 rounded text-xs ${
                                timesheet.status === 'completed' ? 'bg-green-100 text-green-800' : 
                                timesheet.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {timesheet.status === 'completed' ? 'Completado' : 
                                 timesheet.status === 'in-progress' ? 'En progreso' : 'Pausado'}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-center py-8 text-gray-500">
                    No hay registros para este día
                  </p>
                )
              ) : (
                <p className="text-center py-8 text-gray-500">
                  Selecciona un día para ver los registros
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
