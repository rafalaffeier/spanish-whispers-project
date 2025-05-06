
import React, { useState, useEffect } from 'react';
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
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const Login = () => {
  const { setCurrentEmployee } = useTimesheet();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();
  
  // Para propósitos de debug, agregar un log
  useEffect(() => {
    console.log("Login component mounted");
    console.log("Base path:", import.meta.env.BASE_URL);
    // Verificar rutas
    console.log("Current pathname:", window.location.pathname);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Por favor, introduce email y contraseña');
      return;
    }
    
    setIsLoading(true);
    
    try {
      console.log("Intentando iniciar sesión...");
      // Usar la función login de la API 
      const { employee, token } = await login(email, password);
      
      // Si está activa la opción recordar, guardar el email
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }
      
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

  // Cargar email recordado al inicio
  React.useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-white to-gray-50 p-4">
      <div className="w-full max-w-md">
        <CardHeader className="space-y-1 flex flex-col items-center">
          <CardTitle className="text-2xl font-semibold text-center">
            Iniciar Sesión
          </CardTitle>
          <p className="text-sm text-muted-foreground text-center">
            Introduce tus credenciales para acceder
          </p>
        </CardHeader>
        
        <Card className="w-full border shadow-sm">
          <form onSubmit={handleLogin}>
            <CardContent className="p-6 space-y-4">
              <div className="flex overflow-hidden rounded-md border">
                <div className="flex items-center justify-center bg-gray-100 px-3">
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
                <div className="flex items-center justify-center bg-gray-100 px-3">
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
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="remember"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <label htmlFor="remember" className="text-sm text-gray-700">
                    Recordarme
                  </label>
                </div>
                <a href="#" className="text-sm text-purple-700 hover:underline">
                  Recuperar contraseña
                </a>
              </div>
              
              <Button 
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#A4CB6A] hover:bg-[#8FB75A] text-white"
              >
                <span className="flex items-center justify-center text-lg">
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
          
          <CardFooter className="flex justify-center p-6 pt-0 border-t">
            <p className="text-gray-700">
              ¿No tienes cuenta? <button onClick={goToRegister} className="text-purple-700 hover:underline font-medium">Regístrate aquí</button>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Login;
