
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useTimesheet } from '@/context/TimesheetContext';
import TimesheetControl from '@/components/TimesheetControl';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

const EmployeeDashboard = () => {
  const { currentEmployee, setCurrentEmployee, updateTimesheet, getCurrentTimesheet } = useTimesheet();

  if (!currentEmployee) {
    return <Navigate to="/login" />;
  }

  const handleLogout = () => {
    setCurrentEmployee(null);
    // Redirigir al login (no es necesario hacerlo explícitamente ya que el Navigate se activará)
  };

  const currentTimesheet = getCurrentTimesheet();

  return (
    <div className="container max-w-3xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Panel de Empleado</h1>
        <Button variant="outline" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Cerrar sesión
        </Button>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Registro de Jornada</h2>
        <TimesheetControl 
          employee={currentEmployee} 
          onUpdate={updateTimesheet}
          existingTimesheet={currentTimesheet}
        />
      </div>
    </div>
  );
};

export default EmployeeDashboard;
