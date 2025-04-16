
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTimesheet } from '@/context/TimesheetContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { User, Lock, ArrowRight } from 'lucide-react';
import {
  Card,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

const Login = () => {
  const { employees, setCurrentEmployee } = useTimesheet();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleEmployeeLogin = () => {
    if (!email || !password) return;
    
    // Por ahora, vamos a utilizar la lógica existente para facilitar la prueba
    // En una implementación real, habría validación de credenciales
    if (employees.length > 0) {
      setCurrentEmployee(employees[0]);
      navigate('/employee');
    }
  };

  const handleAdminLogin = () => {
    // Por ahora, esto es para mantener el acceso del administrador
    navigate('/admin');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4">
      <h1 className="text-2xl font-medium text-center mb-6">
        Bienvenido si está registrado ingrese sus datos
      </h1>
      
      <Card className="w-full max-w-md border-0 shadow-none">
        <CardContent className="p-0 space-y-4">
          <div className="flex overflow-hidden rounded-md border">
            <div className="flex items-center justify-center bg-gray-100 px-4">
              <User className="h-5 w-5 text-gray-500" />
            </div>
            <Input 
              type="email"
              placeholder="correo@ejemplo.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border-0 flex-1 bg-[#F1F5FF]"
            />
          </div>
          
          <div className="flex overflow-hidden rounded-md border">
            <div className="flex items-center justify-center bg-gray-100 px-4">
              <Lock className="h-5 w-5 text-gray-500" />
            </div>
            <Input 
              type="password" 
              placeholder="••••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border-0 flex-1 bg-[#F1F5FF]"
            />
          </div>
          
          <div className="text-left">
            <a href="#" className="text-purple-700 hover:underline">
              Recupera tu contraseña?
            </a>
          </div>
          
          <Button 
            onClick={handleEmployeeLogin}
            className="w-[250px] bg-[#A4CB6A] hover:bg-[#8FB75A] text-white"
          >
            <span className="flex items-center text-lg">
              <ArrowRight className="mr-2 h-5 w-5" />
              ingresar
            </span>
          </Button>
        </CardContent>
        
        <CardFooter className="flex justify-start p-0 mt-6">
          <p className="text-gray-700">
            Regístrate <a href="#" className="text-purple-700 hover:underline">aquí</a> si aún no estás registrado
          </p>
        </CardFooter>
      </Card>
      
      {/* Mantener el acceso del administrador para pruebas */}
      <div className="mt-6">
        <Button 
          variant="outline" 
          onClick={handleAdminLogin}
          className="text-xs"
        >
          Acceso Administrador (desarrollo)
        </Button>
      </div>
    </div>
  );
};

export default Login;
