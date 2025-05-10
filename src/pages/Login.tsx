import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArrowRight, AlertCircle } from "lucide-react";
import { login } from "@/services/authService";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const formSchema = z.object({
  email: z.string().email("Ingrese un email válido"),
  password: z.string().min(1, "La contraseña es obligatoria"),
});

type FormData = z.infer<typeof formSchema>;

const Login = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  
  // Check if user is already logged in
  useEffect(() => {
    const employee = localStorage.getItem('currentEmployee');
    if (employee) {
      try {
        const employeeData = JSON.parse(employee);
        console.log("Found saved employee data:", employeeData);
        
        // Redirect based on role
        if (employeeData.isCompany || employeeData.role === 'empleador') {
          navigate("/admin");
        } else {
          navigate("/employee");
        }
      } catch (e) {
        console.error("Error parsing saved employee data:", e);
        localStorage.removeItem('currentEmployee');
      }
    }
  }, [navigate]);

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    setLoginError(null);
    
    try {
      const response = await login(data.email, data.password);
      const { employee } = response;
      
      console.log("Login successful, employee data:", employee);
      
      toast({
        title: "Inicio de sesión exitoso",
        description: `¡Bienvenido/a, ${employee.name}!`,
      });
      
      // Redirigir según el rol del usuario
      if (employee.isCompany || employee.role === 'empleador') {
        console.log("Redirecting to admin dashboard");
        navigate("/admin");
      } else {
        console.log("Redirecting to employee dashboard");
        navigate("/employee");
      }
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
      setLoginError(error instanceof Error ? error.message : "Error al iniciar sesión. Verifique sus credenciales.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Control de Jornada</h1>
          <p className="mt-2 text-gray-600">
            Inicia sesión para acceder a tu cuenta
          </p>
        </div>

        {loginError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {loginError}
            </AlertDescription>
          </Alert>
        )}

        <Card className="border border-gray-200">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Iniciar sesión</CardTitle>
            <CardDescription className="text-center">
              Ingresa tus credenciales para continuar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="tucorreo@ejemplo.com"
                          type="email"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel>Contraseña</FormLabel>
                        <Link 
                          to="/password-reset" 
                          className="text-sm text-primary hover:underline"
                        >
                          ¿Olvidaste tu contraseña?
                        </Link>
                      </div>
                      <FormControl>
                        <Input
                          placeholder="••••••••"
                          type="password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    "Iniciando sesión..."
                  ) : (
                    <>
                      Iniciar sesión
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex flex-col">
            <div className="mt-2 text-center text-sm">
              ¿No tienes una cuenta?{" "}
              <Link to="/register" className="text-primary hover:underline">
                Regístrate aquí
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Login;
