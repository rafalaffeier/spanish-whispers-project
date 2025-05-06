
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTimesheet } from '@/context/TimesheetContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { User, Lock, ArrowRight } from 'lucide-react';
import { login } from '@/services/api';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

const Login = () => {
  const { setCurrentEmployee } = useTimesheet();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Por favor, introduce email y contraseña');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Usar la función login de la API 
      const { employee, token } = await login(email, password);
      
      // Guardar el empleado actual en el contexto
      setCurrentEmployee(employee);
      
      // Redireccionar según el rol del usuario
      if (employee.role === 'admin' || employee.role === 'administrador' || employee.role === 'empresa') {
        navigate('/admin');
      } else {
        navigate('/employee');
      }
      
      toast.success(`Bienvenido, ${employee.name}`);
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      toast.error('Credenciales incorrectas o error de conexión');
    } finally {
      setIsLoading(false);
    }
  };

  const goToRegister = () => {
    navigate('/register');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4">
      <h1 className="text-2xl font-medium text-center mb-6">
        Bienvenido si está registrado ingrese sus datos
      </h1>
      
      <Card className="w-full max-w-md border-0 shadow-none">
        <form onSubmit={handleLogin}>
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
              type="submit"
              disabled={isLoading}
              className="w-[250px] bg-[#A4CB6A] hover:bg-[#8FB75A] text-white"
            >
              <span className="flex items-center text-lg">
                {isLoading ? (
                  'Ingresando...'
                ) : (
                  <>
                    <ArrowRight className="mr-2 h-5 w-5" />
                    Ingresar
                  </>
                )}
              </span>
            </Button>
          </CardContent>
        </form>
        
        <CardFooter className="flex justify-start p-0 mt-6">
          <p className="text-gray-700">
            Regístrate <button onClick={goToRegister} className="text-purple-700 hover:underline">aquí</button> si aún no estás registrado
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;
