
// Funciones auxiliares para la API
import { toast } from "sonner";
import { API_BASE_URL, getAuthToken } from './apiConfig';

// Función base para peticiones HTTP con mejor manejo de errores
export const fetchWithAuth = async (
  url: string,
  options: RequestInit = {}
): Promise<any> => {
  try {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Añadir token de autenticación si existe Y la URL no es para login o registro
    const authToken = getAuthToken();
    if (authToken && !url.includes('/login') && !url.includes('/registro') 
        && !url.includes('/recuperar-password') && !url.includes('/reset-password')) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    console.log(`Making API request to: ${API_BASE_URL}${url}`);
    console.log('Request headers:', headers);
    console.log('Request body:', options.body);
    
    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers,
    });

    // Para depuración
    console.log(`Response status for ${url}:`, response.status);
    console.log('Response headers:', Object.fromEntries([...response.headers.entries()]));

    // Verificar si el servidor devolvió un error HTTP (status >= 400)
    if (!response.ok) {
      let errorMessage = `Error ${response.status}: ${response.statusText}`;
      
      // Intentar leer el mensaje de error del cuerpo de la respuesta
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        const errorData = await response.json();
        console.error("API error response (JSON):", errorData);
        errorMessage = errorData.error || errorMessage;
      } else {
        // Para errores no-JSON
        const textError = await response.text();
        console.error("API error response (text):", textError);
        if (textError && textError.length > 0) {
          errorMessage = textError;
        }
      }
      
      // Si es 401 Unauthorized, limpiar autenticación solo si no estamos en login o registro
      if (response.status === 401 && !url.includes('/login') && !url.includes('/registro')) {
        // Importación dinámica para evitar dependencia circular
        const { clearAuth } = await import('./apiConfig');
        clearAuth();
      }
      
      // Formateamos mejor el mensaje de error para errores SQL
      if (errorMessage.includes('SQLSTATE')) {
        // Si es un error SQL, extraer solo el mensaje relevante
        if (errorMessage.includes('Unknown column')) {
          errorMessage = "Error de base de datos: Columna no encontrada. Por favor, contacta al administrador.";
        } else if (errorMessage.includes('Access denied')) {
          errorMessage = "Error de acceso a la base de datos. Por favor, contacta al administrador.";
        } else {
          errorMessage = "Error de base de datos. Por favor, contacta al administrador.";
        }
      }
      
      throw new Error(errorMessage);
    }

    // Para respuestas vacías (como en DELETE)
    if (response.status === 204) {
      return null;
    }

    // Verificar si hay contenido antes de intentar parsear JSON
    const contentLength = response.headers.get('content-length');
    if (contentLength === '0') {
      return {};
    }

    const responseData = await response.json().catch(e => {
      console.error("Error al parsear JSON:", e);
      console.error("Response text:", response.text());
      return {}; 
    });
    console.log("API response data:", responseData);
    return responseData;
  } catch (error) {
    console.error("API request failed:", error);
    
    // Manejar errores de conexión específicamente
    const message = error instanceof Error ? error.message : String(error);
    
    if (error instanceof DOMException && error.name === 'AbortError') {
      console.error("La solicitud fue abortada por tiempo de espera");
      toast.error("La solicitud tomó demasiado tiempo. Por favor intente nuevamente.");
      throw new Error("Tiempo de espera agotado. Por favor intente nuevamente.");
    }
    
    // Mostrar mensajes más amigables para errores comunes
    let userMessage = message;
    if (message.includes('Failed to fetch') || message.includes('Network Error')) {
      userMessage = 'No se pudo conectar al servidor. Verifique su conexión a Internet o contacte al administrador.';
    }
    
    toast.error(`Error: ${userMessage}`);
    throw error;
  }
};

// Funciones para formateo de datos
export const formatDateForApi = (date: Date): string => {
  return date instanceof Date
    ? date.toISOString()
    : new Date(date).toISOString();
};

// Mapeos de estados
export const mapStatusToApi = (status: string): string => {
  const statusMap: Record<string, string> = {
    'not_started': 'no_iniciada',
    'active': 'activa',
    'paused': 'pausada',
    'finished': 'finalizada'
  };
  return statusMap[status] || status;
};

export const mapStatusFromApi = (status: string): string => {
  const statusMap: Record<string, string> = {
    'no_iniciada': 'not_started',
    'activa': 'active',
    'pausada': 'paused',
    'finalizada': 'finished'
  };
  return statusMap[status] || status;
};
