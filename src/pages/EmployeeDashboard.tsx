
import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useTimesheet } from '@/context/TimesheetContext';
import TimesheetControl from '@/components/TimesheetControl';
import { Settings } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import ProfileEditDialog from '@/components/profile/ProfileEditDialog';
import { Button } from '@/components/ui/button';

const EmployeeDashboard = () => {
  const { currentEmployee, setCurrentEmployee, updateTimesheet, getCurrentTimesheet } = useTimesheet();
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);

  if (!currentEmployee) {
    return <Navigate to="/login" />;
  }

  const handleLogout = () => {
    setCurrentEmployee(null);
  };

  const currentTimesheet = getCurrentTimesheet();
  const today = new Date();
  const formattedDate = format(today, "dd-MM-yyyy");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header con botón de configuración */}
      <div className="p-4 flex justify-end">
        <Button variant="ghost" size="icon" onClick={() => setProfileDialogOpen(true)}>
          <Settings className="h-6 w-6 text-gray-500" />
        </Button>
      </div>

      <div className="container max-w-md mx-auto px-4 pb-12">
        {/* Perfil del empleado */}
        <div className="flex flex-col items-center mb-6">
          <Avatar className="h-32 w-32 mb-4">
            <AvatarImage 
              src={currentEmployee.avatar || "/lovable-uploads/7cbe0d8f-8606-47a9-90f0-6e26f18cf47c.png"} 
              alt={currentEmployee.name} 
            />
            <AvatarFallback>{currentEmployee.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <h1 className="text-3xl font-light text-gray-600 text-center">{currentEmployee.name}</h1>
        </div>

        {/* Fecha de la jornada */}
        <h2 className="text-2xl font-medium text-center mb-6">
          Jornada del dia {formattedDate}
        </h2>

        {/* Control de jornada */}
        <TimesheetControl 
          employee={currentEmployee} 
          onUpdate={updateTimesheet}
          existingTimesheet={currentTimesheet}
        />
      </div>

      {/* Diálogo de edición de perfil */}
      <ProfileEditDialog 
        open={profileDialogOpen} 
        onOpenChange={setProfileDialogOpen} 
      />
    </div>
  );
};

export default EmployeeDashboard;
