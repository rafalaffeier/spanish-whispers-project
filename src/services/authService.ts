
// Servicios para autenticación y registro
import { RegistrationData, PasswordResetRequest, PasswordResetConfirm, Employee } from '@/types/timesheet';
import { fetchWithAuth } from './apiHelpers';
import { setAuthToken, API_BASE_URL } from './apiConfig';
import { toast } from "sonner";

// Función para iniciar sesión
export const login = async (email: string, password: string): Promise<{
  employee: Employee,
  token: string
}> => {
  try {
    console.log("[authService] Login attempt for:", email);
    
    // Depuración adicional
    console.log("[authService] API Base URL:", API_BASE_URL);
    
    const response = await fetchWithAuth('/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    console.log("[authService] Login API response:", response);

    if (response && response.token) {
      // Guardar token en localStorage primero para asegurar que está disponible
      localStorage.setItem('authToken', response.token);
      setAuthToken(response.token);
      
      // Mapear respuesta a formato Employee
      const employee: Employee = {
        id: response.empleado.id || '',
        userId: response.empleado.userId || '',
        name: response.empleado.nombre || 'Usuario',
        role: response.empleado.rol || 'empleado',
        isCompany: response.empleado.esEmpresa || false,
        nifdeMiEmpresa: response.empleado.nifdeMiEmpresa || '', // AÑADIDO: poner string vacío si no viene
      };

      console.log("[authService] Parsed employee data:", employee);

      // Guardar el empleado en localStorage para recuperarlo al recargar
      localStorage.setItem('currentEmployee', JSON.stringify(employee));
      
      return {
        employee,
        token: response.token
      };
    }

    throw new Error('Credenciales inválidas');
  } catch (error: any) {
    console.error('[authService] Error durante el login:', error);
    
    // Depuración adicional - mostrar más detalles del error
    if (error.response) {
      console.error('[authService] Error response:', error.response);
    }
    
    // Mejorar detección y manejo de errores
    if (error.error) {
      throw new Error(error.error);
    } else if (error.message && typeof error.message === 'string') {
      throw new Error(error.message);
    } else if (error.statusText) {
      throw new Error(`Error: ${error.statusText}`);
    } else {
      throw new Error('Error al iniciar sesión. Por favor intente nuevamente.');
    }
  }
};

export const register = async (data: RegistrationData): Promise<any> => {
  console.log("%c [REGISTRO] Iniciando registro", "background: #3498db; color: white; padding: 2px 5px; border-radius: 2px;");
  console.log("[REGISTRO] Datos completos:", JSON.stringify(data, null, 2));
  
  // Preparar datos para la API según si es empresa o empleado
  const apiData: Record<string, any> = {
    email: data.email,
    password: data.password
  };

  if (data.type === 'company') {
    // Datos específicos para una empresa (empleador)
    apiData.nombre = data.companyName;
    apiData.nif = data.companyNif;
    apiData.provincia = data.province;
    apiData.direccion = data.companyAddress;
    apiData.codigo_postal = data.zipCode;
    apiData.pais = data.country;
    apiData.telefono = data.phone;
    apiData.es_empresa = true;
    apiData.rol = 'empleador';
    apiData.type = 'company';
    
    // Asegurarnos de que no se envían datos de empleado
    delete apiData.firstName;
    delete apiData.lastName;
    delete apiData.dni;
    
    console.log("[REGISTRO] Registro de EMPRESA con datos:", JSON.stringify(apiData, null, 2));
  } else {
    // Datos específicos para un empleado
    apiData.nombre = data.firstName;
    apiData.apellidos = data.lastName;
    apiData.dni = data.dni;
    apiData.companyNif = data.companyNif;
    apiData.provincia = data.province;
    apiData.direccion = data.address || data.companyAddress;
    apiData.codigo_postal = data.zipCode;
    apiData.pais = data.country;
    apiData.telefono = data.phone;
    apiData.es_empresa = false;
    apiData.rol = 'empleado';
    apiData.type = 'employee';
    
    console.log("[REGISTRO] Registro de EMPLEADO con datos:", JSON.stringify(apiData, null, 2));
  }

  try {
    // Mostrar toast para indicar que se está procesando
    toast.info("Procesando registro...");
    
    console.log("[REGISTRO] URL API:", API_BASE_URL);
    console.log("[REGISTRO] Endpoint:", "/registro");
    console.log("[REGISTRO] Enviando datos:", JSON.stringify(apiData, null, 2));
    
    // Definimos un tiempo de espera de 30 segundos
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    // Para depuración, hacemos un fetch directo para ver la respuesta completa
    console.log("[REGISTRO] Realizando fetch directo para diagnosticar");
    try {
      const directResponse = await fetch(`${API_BASE_URL}/registro`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(apiData),
        signal: controller.signal
      });
      
      const responseText = await directResponse.text();
      console.log("[REGISTRO] Estado de respuesta directa:", directResponse.status, directResponse.statusText);
      console.log("[REGISTRO] Texto de respuesta directa:", responseText);
      console.log("[REGISTRO] Encabezados de respuesta:", 
        Array.from(directResponse.headers.entries()).map(([key, value]) => `${key}: ${value}`).join(', '));
      
      // Intentar parsear como JSON si es posible
      try {
        const jsonResponse = JSON.parse(responseText);
        console.log("[REGISTRO] Respuesta JSON parseada:", jsonResponse);
        
        // Si hay una respuesta exitosa
        if (directResponse.ok) {
          toast.success("Registro completado exitosamente");
          return jsonResponse;
        } else {
          // Mostrar el mensaje de error del servidor
          const errorMsg = jsonResponse.error || `Error ${directResponse.status}: ${directResponse.statusText}`;
          console.error("[REGISTRO] Error del servidor:", errorMsg);
          toast.error("Error en el registro: " + errorMsg);
          throw new Error(errorMsg);
        }
      } catch (parseError) {
        // Si no es JSON, manejamos el texto directamente
        console.error("[REGISTRO] Error al parsear respuesta:", parseError);
        console.error("[REGISTRO] Respuesta no es JSON válido. Contenido:", responseText);
        console.error("[REGISTRO] Longitud de respuesta:", responseText.length);
        console.error("[REGISTRO] Primeros 100 caracteres:", responseText.substring(0, 100));
        
        // Si aún así la respuesta es exitosa
        if (directResponse.ok) {
          toast.success("Registro completado exitosamente");
          return { message: "Registro exitoso", text: responseText };
        } else {
          // Error con respuesta no-JSON
          const errorMsg = `Error ${directResponse.status}: ${directResponse.statusText}`;
          console.error("[REGISTRO] Error con respuesta no-JSON:", errorMsg);
          toast.error("Error en el registro: " + errorMsg);
          throw new Error(errorMsg);
        }
      }
    } catch (fetchError: any) {
      console.error("[REGISTRO] Error en fetch directo:", fetchError);
      console.error("[REGISTRO] Mensaje de error:", fetchError.message);
      
      if (fetchError.name === 'AbortError') {
        console.error("[REGISTRO] La solicitud fue abortada por timeout");
        toast.error("La solicitud ha tardado demasiado tiempo. Inténtelo de nuevo.");
        throw new Error("La solicitud ha tardado demasiado tiempo");
      }
      
      toast.error("Error al comunicarse con el servidor: " + fetchError.message);
      throw fetchError;
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error: any) {
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Error desconocido durante el registro';
    
    console.error("[REGISTRO] Error final:", error);
    console.error("[REGISTRO] Mensaje de error final:", errorMessage);
    
    toast.error(`Error en el registro: ${errorMessage}`);
    throw error;
  }
};

// Funciones para recuperación de contraseña
export const requestPasswordReset = async (data: PasswordResetRequest): Promise<void> => {
  console.log("[authService] Requesting password reset for:", data.email);
  try {
    const response = await fetchWithAuth('/recuperar-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    console.log("[authService] Password reset request response:", response);
    
    return response;
  } catch (error) {
    console.error('[authService] Error requesting password reset:', error);
    throw error;
  }
};

export const confirmPasswordReset = async (data: PasswordResetConfirm): Promise<void> => {
  console.log("[authService] Confirming password reset with token:", data.token);
  try {
    const response = await fetchWithAuth('/reset-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    console.log("[authService] Password reset confirmation response:", response);
    
    return response;
  } catch (error) {
    console.error('[authService] Error confirming password reset:', error);
    throw error;
  }
};
