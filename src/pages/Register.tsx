
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
import { register as registerUser } from '@/services/api';

// Esquema de validación del formulario
const formSchema = z.object({
  type: z.enum(['employee', 'company']),
  firstName: z.string().min(2, 'El nombre es requerido').optional(),
  lastName: z.string().min(2, 'Los apellidos son requeridos').optional(),
  dni: z.string().min(9, 'El NIF/CIF/ID debe tener al menos 9 caracteres').optional(),
  companyName: z.string().min(2, 'El nombre de la empresa es requerido').optional(),
  companyNif: z.string().min(9, 'El NIF/CIF de la empresa debe tener al menos 9 caracteres').optional(),
  province: z.string().min(2, 'La provincia es requerida').optional(),
  companyAddress: z.string().min(5, 'La dirección es requerida').optional(),
  zipCode: z.string().min(5, 'El código postal debe tener al menos 5 caracteres').optional(),
  country: z.string().min(2, 'El país es requerido'),
  phone: z.string().min(9, 'El teléfono debe tener al menos 9 dígitos'),
  email: z.string().email('Debe ser un correo electrónico válido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  confirmPassword: z.string().min(8, 'La confirmación de contraseña es requerida')
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

const Register = () => {
  const navigate = useNavigate();
  const [isEmployee, setIsEmployee] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [companyNameFromNif, setCompanyNameFromNif] = useState<string>("");

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
  });
  
  // Observar el valor del NIF de la empresa para autocompletar el nombre
  const companyNif = useWatch({
    control: form.control,
    name: 'companyNif'
  });
  
  // Efecto para buscar la empresa por NIF
  useEffect(() => {
    if (companyNif && isEmployee && companyNif.length >= 9) {
      // Aquí se haría la llamada al backend para buscar la empresa
      // Por ahora simulamos una respuesta después de un breve retraso
      const timer = setTimeout(() => {
        if (companyNif === "B12345678") {
          setCompanyNameFromNif("APLIUM APLICACIONES TELEMATICAS SL");
          form.setValue('companyName', "APLIUM APLICACIONES TELEMATICAS SL");
        } else if (companyNif === "A87654321") {
          setCompanyNameFromNif("Empresa Ejemplo S.A.");
          form.setValue('companyName', "Empresa Ejemplo S.A.");
        } else {
          setCompanyNameFromNif("");
          form.setValue('companyName', "");
        }
      }, 500);
      
      return () => clearTimeout(timer);
    } else {
      setCompanyNameFromNif("");
    }
  }, [companyNif, isEmployee, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    setApiError(null);
    
    try {
      console.log("Enviando datos de registro:", values);
      
      // Enviar datos al backend
      await registerUser(values as RegistrationData);
      
      toast.success('Registro completado! Redirigiendo al login...');
      
      // Redireccionar al login después de un breve retraso para que el usuario vea el toast
      setTimeout(() => navigate('/login'), 2000);
    } catch (error) {
      console.error('Error durante el registro:', error);
      
      setApiError(
        error instanceof Error 
          ? error.message 
          : 'Error al registrarse. Por favor, intenta nuevamente.'
      );
      
      toast.error('Error al registrarse. Por favor, intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleUserType = (checked: boolean) => {
    setIsEmployee(!checked);
    form.setValue('type', !checked ? 'employee' : 'company');
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
                          placeholder="Nombre de la empresa" 
                          className="border-0 flex-1" 
                          value={isEmployee && companyNameFromNif ? companyNameFromNif : field.value} 
                          onChange={field.onChange}
                          readOnly={isEmployee} 
                        />
                      </div>
                    </FormControl>
                    {isEmployee && companyNif && companyNif.length >= 9 && !companyNameFromNif && (
                      <div className="text-sm text-amber-600 mt-1">
                        No se encontró ninguna empresa con ese NIF/CIF
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
                  <FormItem>
                    <FormLabel>{isEmployee ? "Dirección del empleado" : "Dirección de la empresa"}</FormLabel>
                    <FormControl>
                      <Input 
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
            <div>
              <Button 
                type="submit" 
                className="bg-[#5271FF] hover:bg-[#3a55d9] text-white px-8 py-2"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Enviando...' : 'Enviar'}
              </Button>
            </div>
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
