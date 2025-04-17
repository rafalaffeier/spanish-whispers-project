
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTimesheet } from '@/context/TimesheetContext';
import AdminSidebar from '@/components/AdminSidebar';
import TimesheetTable from '@/components/TimesheetTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar as CalendarIcon, FileDown, FileText, PauseCircle, Clock, Users } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const AdminDashboard = () => {
  const { timesheets, employees } = useTimesheet();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const navigate = useNavigate();
  
  // Formatear fecha para filtrado
  const formattedDate = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';
  
  // Filtrar los registros por fecha y empleado
  const filteredTimesheets = timesheets.filter(timesheet => {
    const matchesDate = !formattedDate || timesheet.date === formattedDate;
    const matchesEmployee = !selectedEmployee || timesheet.employeeId === selectedEmployee;
    return matchesDate && matchesEmployee;
  });

  // Agrupar empleados para el selector
  const uniqueEmployees = employees.filter((employee, index, self) =>
    index === self.findIndex((e) => e.id === employee.id)
  );

  // Función para descargar CSV (simulada)
  const downloadCSV = () => {
    console.log("Descargando CSV...");
    alert("Descarga de CSV iniciada");
  };

  // Función para descargar PDF (simulada)
  const downloadPDF = () => {
    console.log("Descargando PDF...");
    alert("Descarga de PDF iniciada");
  };

  // Calcular pausas totales
  const calculateTotalPauses = () => {
    return filteredTimesheets.reduce((total, timesheet) => {
      return total + (timesheet.pauses ? timesheet.pauses.length : 0);
    }, 0);
  };

  // Calcular horas trabajadas totales (simulado)
  const calculateTotalHours = () => {
    // Esta es una implementación simulada
    return filteredTimesheets.length > 0 ? `${filteredTimesheets.length * 4}h 30m` : "0h 0m";
  };

  return (
    <div className="flex h-screen w-full bg-gray-50">
      <AdminSidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header superior con título */}
        <header className="bg-[#A4CB6A] text-white py-1 px-4 text-center">
          <h1 className="text-lg font-semibold">APLIUM APLICACIONES TELEMATICAS SL</h1>
        </header>
        
        <main className="flex-1 overflow-auto p-6">
          {/* Sección del perfil del empleado */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-8">
            <div className="flex-1"></div>
            <div className="flex flex-col items-center">
              <div className="w-24 h-24 bg-[#A4CB6A] rounded-full flex items-center justify-center text-white overflow-hidden">
                {selectedEmployee ? (
                  <img 
                    src={employees.find(e => e.id === selectedEmployee)?.avatar || '/lovable-uploads/c86911d4-1095-4ee9-9c77-62f624b8e70f.png'} 
                    alt="Avatar" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center">
                    <div className="text-xl font-bold">APLIUM</div>
                    <div className="text-xs">Francesc Gateu</div>
                  </div>
                )}
              </div>
              <h2 className="mt-2 text-lg font-semibold">
                {selectedEmployee 
                  ? employees.find(e => e.id === selectedEmployee)?.name 
                  : 'Francesc Gateu'}
              </h2>
              <p className="text-gray-500">{format(selectedDate || new Date(), 'dd-MM-yyyy')}</p>
            </div>
            <div className="flex-1 flex justify-end space-x-2 mt-4 md:mt-0">
              <Button
                onClick={downloadCSV}
                variant="outline"
                className="bg-blue-500 text-white hover:bg-blue-600"
              >
                <FileDown className="mr-2 h-4 w-4" />
                Descargar Horas en CSV
              </Button>
              <Button
                onClick={downloadPDF}
                variant="outline"
                className="bg-green-500 text-white hover:bg-green-600"
              >
                <FileText className="mr-2 h-4 w-4" />
                Descargar PDF
              </Button>
            </div>
          </div>
          
          {/* Tarjetas de resumen */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500">Total horas trabajadas</p>
                  <p className="text-2xl font-semibold">{calculateTotalHours()}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <Clock className="h-5 w-5 text-blue-500" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500">Total pausas</p>
                  <p className="text-2xl font-semibold">{calculateTotalPauses()}</p>
                </div>
                <div className="bg-yellow-100 p-3 rounded-full">
                  <PauseCircle className="h-5 w-5 text-yellow-500" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500">Empleados activos</p>
                  <p className="text-2xl font-semibold">{uniqueEmployees.length}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <Users className="h-5 w-5 text-green-500" />
                </div>
              </div>
            </div>
          </div>
          
          {/* Filtros y opciones de visualización */}
          <div className="mb-6">
            <div className="flex flex-wrap gap-4 mb-4">
              <p className="text-gray-600">Ver horas por: 
                <span className="ml-2">
                  <a href="#" className="text-blue-500 hover:underline">Hoy</a>
                  <span className="mx-1">|</span>
                  <a href="#" className="text-blue-500 hover:underline">Semanales</a>
                  <span className="mx-1">|</span>
                  <a href="#" className="text-blue-500 hover:underline">Mensuales</a>
                </span>
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {/* Selector de fecha */}
              <div className="flex flex-col">
                <label className="mb-1 text-sm font-medium">Fecha</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, 'dd/MM/yyyy') : "Seleccionar fecha"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      initialFocus
                      locale={es}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              {/* Selector de empleado */}
              <div className="flex flex-col">
                <label className="mb-1 text-sm font-medium">Empleado</label>
                <select
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="">Todos los empleados</option>
                  {uniqueEmployees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.name}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Botón de búsqueda */}
              <div className="flex items-end">
                <Button className="bg-[#A4CB6A] hover:bg-[#8FB75A]">
                  Elegir
                </Button>
              </div>
            </div>
          </div>
          
          {/* Tabla de registros */}
          <div className="bg-white rounded-lg shadow-sm overflow-x-auto">
            <TimesheetTable timesheets={filteredTimesheets} />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
