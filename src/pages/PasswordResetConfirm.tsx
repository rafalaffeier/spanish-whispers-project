
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { ArrowRight, Lock, ArrowLeft, Check } from "lucide-react";
import { toast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { confirmPasswordReset } from "@/services/api";

const formSchema = z.object({
  password: z.string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .max(100, "La contraseña es demasiado larga"),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

type FormValues = z.infer<typeof formSchema>;

const PasswordResetConfirm: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    // Obtener token de la URL
    const params = new URLSearchParams(location.search);
    const tokenParam = params.get('token');
    if (tokenParam) {
      setToken(tokenParam);
    } else {
      toast({
        title: "Error de validación",
        description: "El enlace de recuperación no es válido.",
        variant: "destructive",
      });
    }
  }, [location]);

  async function onSubmit(data: FormValues) {
    if (!token) {
      toast({
        title: "Error de validación",
        description: "No se pudo validar el token de recuperación.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await confirmPasswordReset({
        token,
        // No necesitamos enviar email aquí, según la nueva definición de tipo
        password: data.password,
        confirmPassword: data.confirmPassword
      });

      setSuccess(true);
      toast({
        title: "Contraseña actualizada",
        description: "Tu contraseña ha sido actualizada correctamente.",
        variant: "default",
      });

      // Redirigir al login después de 3 segundos
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar la contraseña. El enlace podría haber expirado.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-white to-gray-50 px-4">
        <div className="w-full max-w-md space-y-8 text-center">
          <div className="mx-auto rounded-full bg-green-100 p-3 w-16 h-16 flex items-center justify-center">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-semibold">¡Contraseña actualizada!</h1>
          <p className="mt-2 text-gray-600">
            Tu contraseña ha sido actualizada correctamente. Serás redirigido al inicio de sesión en unos segundos.
          </p>
          <Button asChild>
            <Link to="/login" className="inline-flex items-center">
              Ir al inicio de sesión
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-white to-gray-50 px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">Establece tu nueva contraseña</h1>
          <p className="mt-2 text-gray-600">
            Ingresa tu nueva contraseña para actualizar tu cuenta
          </p>
        </div>

        <Card className="border border-gray-200">
          <CardHeader className="pb-3">
            <div className="flex justify-center">
              <div className="rounded-full bg-gray-100 p-3">
                <Lock className="h-6 w-6 text-gray-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nueva contraseña</FormLabel>
                      <FormControl>
                        <Input 
                          type="password"
                          placeholder="Introduce tu nueva contraseña" 
                          {...field} 
                        />
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
                      <FormLabel>Confirma tu contraseña</FormLabel>
                      <FormControl>
                        <Input 
                          type="password"
                          placeholder="Confirma tu nueva contraseña" 
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
                  disabled={isSubmitting || !token}
                >
                  {isSubmitting ? (
                    "Actualizando..."
                  ) : (
                    <>
                      Actualizar contraseña
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter>
            <div className="w-full flex justify-center">
              <Link to="/login" className="flex items-center text-sm text-primary hover:underline">
                <ArrowLeft className="mr-1 h-4 w-4" />
                Volver al inicio de sesión
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default PasswordResetConfirm;
