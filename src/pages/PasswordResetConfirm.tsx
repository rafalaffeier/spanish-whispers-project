
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Lock } from 'lucide-react';
import { confirmPasswordReset } from '@/services/authService';

const formSchema = z.object({
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  confirmPassword: z.string().min(8, 'La confirmación de contraseña debe tener al menos 8 caracteres')
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

const PasswordResetConfirm = () => {
  const navigate = useNavigate();
  const { token } = useParams<{ token: string }>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: '',
      confirmPassword: ''
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!token) {
      toast.error("Token de recuperación no válido");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Incluir el token en los datos para el reset
      await confirmPasswordReset({ 
        token: token,
        password: values.password,
        // No incluimos confirmPassword porque no es necesario en la API
      });
      
      toast.success("Contraseña actualizada correctamente");
      
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error) {
      console.error("Error al restablecer la contraseña:", error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Error al restablecer la contraseña';
      
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Establecer nueva contraseña
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nueva contraseña</FormLabel>
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

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Enviando...' : 'Establecer nueva contraseña'}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="justify-center">
          <Button variant="link" onClick={() => navigate('/login')}>
            Volver a inicio de sesión
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default PasswordResetConfirm;
