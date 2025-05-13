
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, Link } from "react-router-dom";
import { ArrowRight, Mail, ArrowLeft } from "lucide-react";
import { toast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { requestPasswordReset } from "@/services/api";
import DebugPanel from "@/components/debug/DebugPanel";

const formSchema = z.object({
  email: z.string().email("Ingresa un email válido"),
});

type FormValues = z.infer<typeof formSchema>;

const PasswordReset: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [debugData, setDebugData] = React.useState<Record<string, any>>({});

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  // Función para añadir logs
  const addLog = (message: string) => {
    console.log(`[PasswordReset] ${message}`);
    setDebugData(prev => ({
      ...prev,
      lastAction: message,
      timestamp: new Date().toISOString()
    }));
  };

  // Añadir log de carga de página
  React.useEffect(() => {
    addLog("Password reset page loaded");
    setDebugData({
      page: "PasswordReset",
      timestamp: new Date().toISOString()
    });
  }, []);

  async function onSubmit(data: FormValues) {
    setIsSubmitting(true);
    addLog(`Requesting password reset for: ${data.email}`);
    
    try {
      await requestPasswordReset({ email: data.email });
      toast({
        title: "Solicitud enviada",
        description: "Si el correo electrónico existe, recibirás instrucciones para recuperar tu contraseña.",
        variant: "default",
      });
      addLog(`Password reset request sent successfully for: ${data.email}`);
      form.reset();
    } catch (error) {
      // Incluso si hay un error, mostraremos el mismo mensaje
      // para evitar revelar qué emails existen en el sistema
      toast({
        title: "Solicitud enviada",
        description: "Si el correo electrónico existe, recibirás instrucciones para recuperar tu contraseña.",
        variant: "default",
      });
      addLog(`Error during password reset request: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-white to-gray-50 px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">Recuperación de contraseña</h1>
          <p className="mt-2 text-gray-600">
            Ingresa tu email para recibir instrucciones
          </p>
        </div>

        <Card className="border border-gray-200">
          <CardHeader className="pb-3">
            <div className="flex justify-center">
              <div className="rounded-full bg-gray-100 p-3">
                <Mail className="h-6 w-6 text-gray-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="flex items-center border border-gray-300 rounded-md focus-within:ring-1 focus-within:ring-primary focus-within:border-primary">
                          <div className="flex items-center justify-center w-12 border-r border-gray-300 h-10">
                            <Mail className="h-5 w-5 text-gray-500" />
                          </div>
                          <Input
                            placeholder="Ingresa tu email para recuperar"
                            className="flex-1 border-none focus-visible:ring-0 focus-visible:ring-offset-0"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <p className="text-center text-sm text-gray-600">
                  Recupera tu contraseña, usa tu email en el siguiente campo.
                </p>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    "Enviando..."
                  ) : (
                    <>
                      Enviar
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
      
      {/* Debug Panel */}
      <DebugPanel 
        title="Password Reset Debug" 
        data={debugData} 
      />
    </div>
  );
};

export default PasswordReset;
