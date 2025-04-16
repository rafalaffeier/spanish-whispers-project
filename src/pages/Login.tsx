
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTimesheet } from '@/context/TimesheetContext';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Clock, User, UserCog } from 'lucide-react';

const Login = () => {
  const { employees, setCurrentEmployee } = useTimesheet();
  const [selectedEmployee, setSelectedEmployee] = React.useState('');
  const navigate = useNavigate();

  const handleEmployeeLogin = () => {
    if (!selectedEmployee) return;
    
    const employee = employees.find(e => e.id === selectedEmployee);
    if (employee) {
      setCurrentEmployee(employee);
      navigate('/employee');
    }
  };

  const handleAdminLogin = () => {
    navigate('/admin');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Control de Jornada</CardTitle>
          <CardDescription>
            Selecciona tu perfil para iniciar sesión
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-medium flex items-center">
                <User className="mr-2 h-5 w-5" />
                Acceso de Empleado
              </h3>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar empleado" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map(employee => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.name} - {employee.role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                className="w-full mt-2" 
                onClick={handleEmployeeLogin}
                disabled={!selectedEmployee}
              >
                <Clock className="mr-2 h-4 w-4" />
                Iniciar como Empleado
              </Button>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  O
                </span>
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-medium flex items-center">
                <UserCog className="mr-2 h-5 w-5" />
                Acceso de Administrador
              </h3>
              <Button 
                className="w-full" 
                variant="outline"
                onClick={handleAdminLogin}
              >
                <UserCog className="mr-2 h-4 w-4" />
                Iniciar como Administrador
              </Button>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center text-sm text-muted-foreground">
          Sistema de control de jornada laboral con geolocalización
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;
