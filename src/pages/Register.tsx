
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { ChevronDown, Mail, Lock, User, Building, MapPin, Phone } from 'lucide-react';
import { RegistrationData } from '@/types/timesheet';

// Esquema de validación del formulario
const formSchema = z.object({
  type: z.enum(['employee', 'company']),
  firstName: z.string().min(2, 'El nombre es requerido').optional(),
  lastName: z.string().min(2, 'Los apellidos son requeridos').optional(),
  dni: z.string().min(9, 'El NIF/CIF/ID debe tener al menos 9 caracteres').optional(),
  companyName: z.string().min(2, 'El nombre de la empresa es requerido').optional(),
  companyNif: z.string().min(9, 'El NIF/CIF de la empresa debe tener al menos 9 caracteres').optional(),
  province: z.string().min(2, 'La provincia es requerida').optional(),
  companyAddress: z.string().min(5, 'La dirección de la empresa es requerida').optional(),
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

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    // En una implementación real, esto enviaría los datos al backend
    console.log('Datos de registro:', values);
    
    toast.success('Registro completado! Redirigiendo al login...');
    
    // Redireccionar al login después de un breve retraso para que el usuario vea el toast
    setTimeout(() => navigate('/login'), 2000);
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

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Primera fila */}
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
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
                    <FormControl>
                      <Input placeholder="Apellidos" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Segunda fila */}
              <FormField
                control={form.control}
                name="dni"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input placeholder="NIF / CIF / ID" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="companyNif"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input placeholder="NIF / CIF / ID de la empresa" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Tercera fila */}
              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="flex overflow-hidden rounded-md border">
                        <div className="flex items-center justify-center bg-gray-100 px-4">
                          <Building className="h-5 w-5 text-gray-500" />
                        </div>
                        <Input placeholder="Nombre de la empresa" className="border-0 flex-1" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
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

              {/* Cuarta fila */}
              <FormField
                control={form.control}
                name="province"
                render={({ field }) => (
                  <FormItem>
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
              
              <FormField
                control={form.control}
                name="companyAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input placeholder="Calle de la empresa" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Quinta fila */}
              <FormField
                control={form.control}
                name="zipCode"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input placeholder="Código postal" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
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

              {/* Sexta fila */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
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
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
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

              {/* Séptima fila (solo una columna) */}
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
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
              >
                Enviar
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
