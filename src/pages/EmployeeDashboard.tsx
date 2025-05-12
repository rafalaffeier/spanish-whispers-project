
import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useTimesheet } from '@/context/TimesheetContext';
import TimesheetControl from '@/components/TimesheetControl';
import { Settings } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import ProfileEditDialog from '@/components/profile/ProfileEditDialog';
import { Button } from '@/components/ui/button';

const EmployeeDashboard = () => {
  const navigate = useNavigate();
  const { currentEmployee, setCurrentEmployee, updateTimesheet, getCurrentTimesheet, loading } = useTimesheet();
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  
  // Verificar autenticación al cargar
  useEffect(() => {
    const checkAuthentication = async () => {
      // Si el context ya terminó de cargar y no hay empleado, redirigir
      if (!loading && !currentEmployee) {
        console.log("No hay empleado activo y ya terminó de cargar, redirigiendo a login");
        navigate("/login", { replace: true });
      }
    };
    
    checkAuthentication();
  }, [currentEmployee, navigate, loading]);

  // Mostrar pantalla de carga mientras se verifica la autenticación
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
        <p>Cargando...</p>
      </div>
    );
  }

  // Si no hay empleado activo y ya terminó de cargar, redirigir a login
  if (!currentEmployee) {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = () => {
    setCurrentEmployee(null);
    navigate('/login', { replace: true });
  };

  const currentTimesheet = getCurrentTimesheet();
  const today = new Date();
  const formattedDate = format(today, "dd-MM-yyyy");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header con botón de configuración y logout */}
      <div className="p-4 flex justify-between items-center">
        <h2 className="text-lg font-medium">Control de Jornada</h2>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={() => setProfileDialogOpen(true)}>
            <Settings className="h-6 w-6 text-gray-500" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            Cerrar sesión
          </Button>
        </div>
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
          Jornada del día {formattedDate}
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
