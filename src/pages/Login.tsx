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
import { useTimesheet } from "@/context/TimesheetContext";
import DebugPanel from "@/components/debug/DebugPanel";

const formSchema = z.object({
  email: z.string().email("Ingrese un email válido"),
  password: z.string().min(1, "La contraseña es obligatoria"),
});

type FormData = z.infer<typeof formSchema>;

const Login = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const { setCurrentEmployee } = useTimesheet();
  const [debugData, setDebugData] = useState({});
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [lastEmployee, setLastEmployee] = useState<any>(null);
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });
  
  // Función para añadir logs
  const addLog = (message: string) => {
    setDebugLogs(prev => [...prev, message]);
    setDebugData(prev => ({
      ...prev,
      lastAction: message,
      timestamp: new Date().toISOString()
    }));
    console.log("[Login]", message);
  };
  
  // Añadimos un log para verificar que la página se está cargando
  useEffect(() => {
    addLog("Login page loaded");
    
    // Check if user is already logged in
    const token = localStorage.getItem('authToken');
    if (token) {
      const employee = localStorage.getItem('currentEmployee');
      if (employee) {
        try {
          const employeeData = JSON.parse(employee);
          addLog(`Found saved employee data: ${JSON.stringify(employeeData)}`);
          
          // Redirect based on role after a short delay to ensure context is loaded
          setTimeout(() => {
            if (employeeData.isCompany || employeeData.role === 'empleador') {
              addLog("Redirecting to admin dashboard");
              navigate("/admin");
            } else {
              addLog("Redirecting to employee dashboard");
              navigate("/employee");
            }
          }, 100);
        } catch (e) {
          addLog(`Error parsing saved employee data: ${e instanceof Error ? e.message : String(e)}`);
          localStorage.removeItem('currentEmployee');
          localStorage.removeItem('authToken');
        }
      } else {
        addLog("Token exists but no employee data");
        localStorage.removeItem('authToken');
      }
    } else {
      addLog("No auth token found, staying on login page");
    }
  }, [navigate]);

  // Modificamos onSubmit sólo para mostrar más logs explícitos si hay duda de detección
  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    setLoginError(null);

    try {
      addLog(`Iniciando login con email: ${data.email}`);
      const response = await login(data.email, data.password);
      addLog(`Login successful, response: ${JSON.stringify(response)}`);

      const { employee } = response;
      setCurrentEmployee(employee);
      setDebugData(prev => ({
        ...prev,
        currentEmployee: employee,
        redirectionInfo: (employee as any)._debug_redirectionInfo || {},
      }));
      setLastEmployee(employee);

      // Log explícito de todos los campos brutos relevantes:
      const deb = (employee as any)._debug_redirectionInfo || {};
      addLog(`[TEST LOGIN] role_fields: ${JSON.stringify(deb.role_fields)} | razón: ${deb.DETECCION_MOTIVO}`);

      toast({
        title: "Inicio de sesión exitoso",
        description: `¡Bienvenido/a, ${employee.name}!`,
      });

      // --- LÓGICA DE REDIRECCIÓN REFORZADA ---
      /**
       * 1. Usar todos los campos posibles: isCompany, role, rol, rol_id, esEmpresa, is_company, email
       * 2. Asumir "empleador" si cualquiera de sus formas coincide
       * 3. Siempre dejar logs claros del motivo de la decisión
       */
      const campos = {
        isCompany: employee.isCompany,
        role: employee.role,
        email: employee.email,
        raw: (employee as any)._debug_redirectionInfo?.role_fields || {},
        motivo: (employee as any)._debug_redirectionInfo?.DETECCION_MOTIVO || "",
      };
      addLog(`[REDIRECT CHECK] Campos usados para decisión: ${JSON.stringify(campos)}`);

      const raw = campos.raw;

      // Criterios admin/empleador robustos
      const esAdmin =
        employee.isCompany === true ||
        employee.role?.toLowerCase() === "empleador" ||
        employee.role?.toLowerCase() === "admin" ||
        employee.role?.toLowerCase() === "administrador" ||
        employee.role?.toLowerCase() === "company" ||
        employee.role?.toLowerCase() === "empresa" ||
        // Backward compatible: si los campos raw del backend indican admin
        raw.isCompany === true ||
        raw.esEmpresa === true ||
        raw.rol === "empleador" ||
        raw.role === "empleador" ||
        raw.rol === "admin" ||
        raw.role === "admin" ||
        raw.rol === "administrador" ||
        raw.role === "administrador" ||
        raw.rol_id == 1 || raw.rol_id === "1" ||
        // Heurística por email si el campo viene vacío
        (typeof employee.email === "string" && (
          employee.email.includes("admin@") ||
          employee.email.includes("empleador@") ||
          employee.email.endsWith("@tudominio.com")
        ));

      if (esAdmin) {
        addLog("[REDIRECTION] Usuario detectado como ADMIN/EMPRESA → navegando a /admin");
        navigate("/admin", { replace: true });
      } else {
        addLog("[REDIRECTION] Usuario detectado como EMPLEADO → navegando a /employee");
        navigate("/employee", { replace: true });
      }
    } catch (error) {
      addLog(`Error al iniciar sesión: ${error instanceof Error ? error.message : String(error)}`);
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
                  onClick={() => addLog("Botón de login presionado")}
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

      {/* PANEL DE DEPURACIÓN (visualización) */}
      <DebugPanel 
        title="Login Debug"
        data={{
          ...debugData,
          // Incrustamos el último "employee" recibido
          ultimoEmpleado: lastEmployee,
          redirectionDeteccionInfo: lastEmployee?._debug_redirectionInfo || {},
          // Mostrar siempre datos crudos relevantes
          camposRaw: lastEmployee?._debug_redirectionInfo?.role_fields || {},
          motivoRedireccion: lastEmployee?._debug_redirectionInfo?.DETECCION_MOTIVO || ''
        }}
      />
    </div>
  );
};

export default Login;
