
import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useTimesheet } from '@/context/TimesheetContext';
import TimesheetTable from '@/components/TimesheetTable';
import { Button } from '@/components/ui/button';
import { LogOut, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const AdminDashboard = () => {
  const { timesheets, setCurrentEmployee } = useTimesheet();
  const [dateFilter, setDateFilter] = useState('');
  const [employeeFilter, setEmployeeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Verificar si está autenticado como admin (simplificado para demo)
  const isAdmin = true;
  
  if (!isAdmin) {
    return <Navigate to="/login" />;
  }

  const handleLogout = () => {
    setCurrentEmployee(null);
    // Redirigir al login
  };

  // Filtrar los registros
  const filteredTimesheets = timesheets.filter(timesheet => {
    const matchesDate = !dateFilter || timesheet.date === dateFilter;
    const matchesEmployee = !employeeFilter || timesheet.employeeName.toLowerCase().includes(employeeFilter.toLowerCase());
    const matchesStatus = !statusFilter || timesheet.status === statusFilter;
    
    return matchesDate && matchesEmployee && matchesStatus;
  });

  // Obtener lista única de empleados para el filtro
  const uniqueEmployees = Array.from(new Set(timesheets.map(t => t.employeeName)));

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Panel de Administrador</h1>
        <Button variant="outline" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Cerrar sesión
        </Button>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <Filter className="mr-2 h-5 w-5" />
          Filtros
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Fecha</label>
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Empleado</label>
            <Input
              type="text"
              placeholder="Buscar por nombre"
              value={employeeFilter}
              onChange={(e) => setEmployeeFilter(e.target.value)}
              className="w-full"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Estado</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value="not_started">No iniciada</SelectItem>
                <SelectItem value="active">Activa</SelectItem>
                <SelectItem value="paused">Pausada</SelectItem>
                <SelectItem value="finished">Finalizada</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md overflow-x-auto">
        <h2 className="text-xl font-semibold mb-4">Registro de Jornadas</h2>
        <TimesheetTable timesheets={filteredTimesheets} />
      </div>
    </div>
  );
};

export default AdminDashboard;
