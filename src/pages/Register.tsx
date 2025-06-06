
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { ChevronDown, Mail, Lock, User, Building, MapPin, Phone } from 'lucide-react';
import { RegistrationData } from '@/types/timesheet';
import { register as registerUser } from '@/services/authService';
import { Textarea } from '@/components/ui/textarea';
import { API_BASE_URL } from '@/services/apiConfig';
import { verifyCompanyByNif } from '@/services/companyService';

// Esquema de validación del formulario - corregido para validación condicional
const formSchema = z.object({
  type: z.enum(['employee', 'company']),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  dni: z.string().optional(),
  companyName: z.string().optional(),
  companyNif: z.string().optional(),
  province: z.string().min(2, 'La provincia es requerida').optional(),
  companyAddress: z.string().optional(),
  zipCode: z.string().min(5, 'El código postal debe tener al menos 5 caracteres').optional(),
  country: z.string().min(2, 'El país es requerido'),
  phone: z.string().min(9, 'El teléfono debe tener al menos 9 dígitos'),
  email: z.string().email('Debe ser un correo electrónico válido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  confirmPassword: z.string().min(8, 'La confirmación de contraseña es requerida')
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
}).superRefine((data, ctx) => {
  // Validación según el tipo de usuario
  if (data.type === 'employee') {
    // Validación para empleados
    if (!data.firstName || data.firstName.length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "El nombre es requerido",
        path: ["firstName"]
      });
    }
    
    if (!data.lastName || data.lastName.length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Los apellidos son requeridos",
        path: ["lastName"]
      });
    }
    
    if (!data.dni || data.dni.length < 9) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "El NIF/CIF/ID debe tener al menos 9 caracteres",
        path: ["dni"]
      });
    }
    
    if (!data.companyNif || data.companyNif.length < 9) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "El NIF/CIF de empresa es requerido",
        path: ["companyNif"]
      });
    }
  } else if (data.type === 'company') {
    // Validación para empresas
    if (!data.companyName || data.companyName.length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "El nombre de la empresa es requerido",
        path: ["companyName"]
      });
    }
    
    if (!data.companyNif || data.companyNif.length < 9) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "El NIF/CIF de la empresa debe tener al menos 9 caracteres",
        path: ["companyNif"]
      });
    }
    
    if (!data.companyAddress || data.companyAddress.length < 5) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "La dirección de la empresa es requerida",
        path: ["companyAddress"]
      });
    }
  }
});

const Register = () => {
  const navigate = useNavigate();
  const [isEmployee, setIsEmployee] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [companyNameFromNif, setCompanyNameFromNif] = useState<string>("");
  const [companyVerified, setCompanyVerified] = useState(false);
  const [isCheckingCompany, setIsCheckingCompany] = useState(false);
  const [debugMode, setDebugMode] = useState(true); // Activamos el modo debug por defecto para troubleshooting
  const [requestLogs, setRequestLogs] = useState<string[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: 'employee',
      firstName: '',
      lastName: '',
      dni: '',
      companyName: '',
      companyNif: '',
      province: '',
      companyAddress: '',
      zipCode: '',
      country: 'España',
      phone: '',
      email: '',
      password: '',
      confirmPassword: ''
    },
    mode: 'onChange' // Validar al cambiar los campos
  });
  
  // Observar el valor del NIF de la empresa para autocompletar el nombre
  const companyNif = useWatch({
    control: form.control,
    name: 'companyNif'
  });
  
  // Función para añadir entradas al log de depuración
  const addToLog = (message: string) => {
    setRequestLogs(prev => [...prev, `${new Date().toISOString()}: ${message}`]);
    console.log(`[REGISTRO] ${message}`);
  };
  
  // Efecto para buscar la empresa por NIF
  useEffect(() => {
    const checkCompany = async () => {
      if (companyNif && isEmployee && companyNif.length >= 8) {
        try {
          setIsCheckingCompany(true);
          setCompanyVerified(false);
          setCompanyNameFromNif("");
          addToLog(`Verificando empresa con NIF: ${companyNif}`);
          
          // Realizar la verificación de la empresa
          const result = await verifyCompanyByNif(companyNif);
          
          if (result.exists && result.company) {
            setCompanyNameFromNif(result.company.name);
            form.setValue('companyName', result.company.name);
            setCompanyVerified(true);
            addToLog(`Empresa encontrada: ${result.company.name}`);
          } else {
            setCompanyNameFromNif("");
            form.setValue('companyName', "");
            setCompanyVerified(false);
            addToLog(`No se encontró ninguna empresa con el NIF: ${companyNif}`);
          }
        } catch (error) {
          console.error("Error al verificar empresa:", error);
          addToLog(`Error al verificar empresa: ${error instanceof Error ? error.message : String(error)}`);
          setCompanyNameFromNif("");
          form.setValue('companyName', "");
          setCompanyVerified(false);
        } finally {
          setIsCheckingCompany(false);
        }
      } else {
        if (!isEmployee || companyNif.length < 8) {
          setCompanyNameFromNif("");
          setCompanyVerified(false);
        }
      }
    };
    
    // Usar un debounce para no hacer demasiadas solicitudes
    const timer = setTimeout(checkCompany, 500);
    return () => clearTimeout(timer);
  }, [companyNif, isEmployee, form]);
  
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    setApiError(null);
    
    try {
      addToLog(`Iniciando registro de tipo: ${values.type}`);
      addToLog(`Datos del formulario: ${JSON.stringify(values)}`);
      
      // Preparar datos para el registro
      const registrationData: RegistrationData = {
        type: values.type,
        email: values.email,
        password: values.password,
        confirmPassword: values.confirmPassword,
        phone: values.phone,
        country: values.country,
        province: values.province || '',
        zipCode: values.zipCode || ''
      };
      
      // Añadir campos según el tipo de registro
      if (values.type === 'company') {
        registrationData.companyName = values.companyName || '';
        registrationData.companyNif = values.companyNif || '';
        registrationData.companyAddress = values.companyAddress || '';
        
        // Limpiar campos de empleado para evitar confusiones
        delete registrationData.firstName;
        delete registrationData.lastName;
        delete registrationData.dni;
      } else {
        registrationData.firstName = values.firstName || '';
        registrationData.lastName = values.lastName || '';
        registrationData.dni = values.dni || '';
        registrationData.companyNif = values.companyNif || '';
        registrationData.address = values.companyAddress || ''; // Usar la misma dirección para empleado
      }
      
      addToLog(`Datos preparados para API: ${JSON.stringify(registrationData, null, 2)}`);
      
      try {
        addToLog('Llamando a función registerUser...');
        const response = await registerUser(registrationData);
        addToLog(`Respuesta recibida: ${JSON.stringify(response)}`);
        toast.success('Registro completado exitosamente! Redirigiendo al login...');
        
        // Redireccionar al login después de un breve retraso
        setTimeout(() => navigate('/login'), 2000);
      } catch (error: any) {
        const errorMessage = error instanceof Error 
          ? error.message 
          : 'Error al registrarse. Por favor, intenta nuevamente.';
        
        addToLog(`Error en el registro: ${errorMessage}`);
        addToLog(`Error completo: ${JSON.stringify(error, null, 2)}`);
        
        setApiError(errorMessage);
        toast.error(`Error al registrarse: ${errorMessage}`);
      }
    } catch (error: any) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Error al validar los datos. Por favor, revisa el formulario.';
      
      addToLog(`Error en validación: ${errorMessage}`);
      setApiError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleUserType = (checked: boolean) => {
    setIsEmployee(!checked);
    const newType = !checked ? 'employee' : 'company';
    addToLog(`Cambiando tipo de usuario a: ${newType}`);
    form.setValue('type', newType);
    
    // Resetear campos no relevantes según el tipo
    if (newType === 'company') {
      form.setValue('firstName', '');
      form.setValue('lastName', '');
      form.setValue('dni', '');
    } else {
      // No resetear el NIF de empresa para empleados, ya que lo necesitan para asociarse
    }
  };

  return (
    <div className="min-h-screen p-6 flex flex-col items-center justify-center bg-white">
      <div className="w-full max-w-4xl">
        <h1 className="text-3xl font-medium mb-8 text-gray-900">
          Bienvenido a la página de registro
        </h1>
        
        <div className="flex items-center mb-8 space-x-4">
          <div className={`flex items-center space-x-2 ${!isEmployee ? 'text-gray-900' : 'text-gray-400'}`}>
            <span className="text-lg">Empresa</span>
          </div>
          
          <Switch
            checked={!isEmployee}
            onCheckedChange={toggleUserType}
            className="data-[state=checked]:bg-[#66CC99] data-[state=unchecked]:bg-gray-300"
          />
          
          <div className={`flex items-center space-x-2 ${isEmployee ? 'text-gray-900' : 'text-gray-400'}`}>
            <span className="text-lg">Empleado</span>
          </div>
        </div>

        {apiError && (
          <div className="mb-6 p-4 border border-red-300 bg-red-50 text-red-700 rounded-md">
            <p className="font-medium">Error:</p>
            <p>{apiError}</p>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Campos para empleado */}
              {isEmployee && (
                <>
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre del empleado</FormLabel>
                        <FormControl>
                          <div className="flex overflow-hidden rounded-md border">
                            <div className="flex items-center justify-center bg-gray-100 px-4">
                              <User className="h-5 w-5 text-gray-500" />
                            </div>
                            <Input placeholder="Nombre" className="border-0 flex-1" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Apellidos del empleado</FormLabel>
                        <FormControl>
                          <Input placeholder="Apellidos" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dni"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>NIF/CIF/ID del empleado</FormLabel>
                        <FormControl>
                          <Input placeholder="NIF / CIF / ID del empleado" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
              
              {/* Campos para NIF de empresa (visible en ambos casos) */}
              <FormField
                control={form.control}
                name="companyNif"
                render={({ field }) => (
                  <FormItem className={isEmployee ? "md:col-span-1" : "md:col-span-2"}>
                    <FormLabel>
                      {isEmployee ? "NIF/CIF de la empresa donde trabajas" : "NIF/CIF de la empresa"}
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder={isEmployee ? "NIF/CIF de tu empresa" : "NIF/CIF de la empresa"} 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Nombre de la empresa */}
              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem className={isEmployee ? "md:col-span-1" : "md:col-span-2"}>
                    <FormLabel>
                      {isEmployee ? "Nombre de la empresa donde trabajas" : "Nombre de la empresa"}
                    </FormLabel>
                    <FormControl>
                      <div className="flex overflow-hidden rounded-md border">
                        <div className="flex items-center justify-center bg-gray-100 px-4">
                          <Building className="h-5 w-5 text-gray-500" />
                        </div>
                        <Input 
                          placeholder={isCheckingCompany ? "Verificando empresa..." : "Nombre de la empresa"} 
                          className="border-0 flex-1" 
                          value={isEmployee && companyVerified ? companyNameFromNif : field.value}
                          onChange={field.onChange}
                          readOnly={isEmployee && companyVerified} 
                        />
                      </div>
                    </FormControl>
                    {isEmployee && companyNif && companyNif.length >= 8 && !companyNameFromNif && !isCheckingCompany && (
                      <div className="text-sm text-amber-600 mt-1">
                        No se encontró ninguna empresa con ese NIF/CIF
                      </div>
                    )}
                    {isEmployee && isCheckingCompany && (
                      <div className="text-sm text-blue-600 mt-1">
                        Verificando empresa...
                      </div>
                    )}
                    {isEmployee && companyVerified && companyNameFromNif && (
                      <div className="text-sm text-green-600 mt-1">
                        Empresa verificada correctamente
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* País */}
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isEmployee ? "País del empleado" : "País de la empresa"}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="País" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="España">España</SelectItem>
                        <SelectItem value="Portugal">Portugal</SelectItem>
                        <SelectItem value="Francia">Francia</SelectItem>
                        <SelectItem value="Italia">Italia</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Provincia */}
              <FormField
                control={form.control}
                name="province"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isEmployee ? "Provincia del empleado" : "Provincia de la empresa"}</FormLabel>
                    <FormControl>
                      <div className="flex overflow-hidden rounded-md border">
                        <div className="flex items-center justify-center bg-gray-100 px-4">
                          <MapPin className="h-5 w-5 text-gray-500" />
                        </div>
                        <Input placeholder="Provincia" className="border-0 flex-1" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Dirección */}
              <FormField
                control={form.control}
                name="companyAddress"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>{isEmployee ? "Dirección del empleado" : "Dirección de la empresa"}</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder={isEmployee ? "Dirección del empleado" : "Dirección de la empresa"} 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Código postal */}
              <FormField
                control={form.control}
                name="zipCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isEmployee ? "Código postal del empleado" : "Código postal de la empresa"}</FormLabel>
                    <FormControl>
                      <Input placeholder="Código postal" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Teléfono */}
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isEmployee ? "Teléfono del empleado" : "Teléfono de la empresa"}</FormLabel>
                    <FormControl>
                      <div className="flex overflow-hidden rounded-md border">
                        <div className="flex items-center justify-center bg-gray-100 px-4">
                          <Phone className="h-5 w-5 text-gray-500" />
                        </div>
                        <Input placeholder="Teléfono" className="border-0 flex-1" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Email */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Correo electrónico</FormLabel>
                    <FormControl>
                      <div className="flex overflow-hidden rounded-md border">
                        <div className="flex items-center justify-center bg-gray-100 px-4">
                          <Mail className="h-5 w-5 text-gray-500" />
                        </div>
                        <Input placeholder="Dirección de correo electrónico" className="border-0 flex-1" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Contraseña */}
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contraseña</FormLabel>
                    <FormControl>
                      <div className="flex overflow-hidden rounded-md border">
                        <div className="flex items-center justify-center bg-gray-100 px-4">
                          <Lock className="h-5 w-5 text-gray-500" />
                        </div>
                        <Input placeholder="Contraseña" type="password" className="border-0 flex-1" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Confirmar contraseña */}
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmar contraseña</FormLabel>
                    <FormControl>
                      <div className="flex overflow-hidden rounded-md border">
                        <div className="flex items-center justify-center bg-gray-100 px-4">
                          <Lock className="h-5 w-5 text-gray-500" />
                        </div>
                        <Input placeholder="Confirmar contraseña" type="password" className="border-0 flex-1" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Botón de enviar */}
            <div className="flex justify-between">
              <Button 
                type="submit" 
                className="bg-[#5271FF] hover:bg-[#3a55d9] text-white px-8 py-2"
                disabled={isSubmitting}
                onClick={() => {
                  addToLog("Botón de envío clickeado");
                }}
              >
                {isSubmitting ? 'Enviando...' : 'Enviar'}
              </Button>
              
              {/* Botón para activar modo debug */}
              <Button
                type="button"
                variant="outline"
                onClick={() => setDebugMode(!debugMode)}
              >
                {debugMode ? "Ocultar Debug" : "Mostrar Debug"}
              </Button>
            </div>
            
            {/* Panel de debug - siempre activado para troubleshooting */}
            {debugMode && (
              <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                <h3 className="text-sm font-medium mb-2">Estado del formulario:</h3>
                <pre className="text-xs whitespace-pre-wrap overflow-auto max-h-40 p-2 bg-gray-100 rounded">
                  {JSON.stringify(form.getValues(), null, 2)}
                </pre>
                
                <h3 className="text-sm font-medium mt-4 mb-2">Log de eventos:</h3>
                <div className="text-xs bg-black text-green-400 p-2 rounded overflow-auto max-h-60 font-mono">
                  {requestLogs.map((log, index) => (
                    <div key={index}>{log}</div>
                  ))}
                  {requestLogs.length === 0 && <div>No hay eventos registrados</div>}
                </div>

                <div className="mt-4 flex justify-between">
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => setRequestLogs([])}
                  >
                    Limpiar logs
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      addToLog("Test de conectividad: " + API_BASE_URL);
                      // Intentar una petición simple para verificar conectividad
                      fetch(API_BASE_URL + "/ping")
                        .then(res => res.text())
                        .then(data => addToLog("Respuesta de ping: " + data))
                        .catch(err => addToLog("Error de ping: " + err.message));
                    }}
                  >
                    Test API
                  </Button>
                </div>
              </div>
            )}
          </form>
        </Form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            ¿Ya tienes una cuenta? 
            <button 
              onClick={() => navigate('/login')} 
              className="ml-2 text-[#5271FF] hover:underline"
            >
              Iniciar sesión
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
