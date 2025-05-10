
// Funciones auxiliares para la API
import { toast } from "sonner";
import { API_BASE_URL, getAuthToken } from './apiConfig';
import { isValidDate, toSafeDate } from '@/utils/dateUtils';

// Función para mapear el estado de la API al formato de la aplicación
export const mapStatusFromApi = (status: string): string => {
  const statusMap: Record<string, string> = {
    'no_iniciada': 'not_started',
    'activa': 'active',
    'pausada': 'paused',
    'finalizada': 'finished'
  };
  return statusMap[status] || status;
};

// Función para formatear una fecha para la API
export const formatDateForApi = (date: Date): string => {
  return date.toISOString();
};

// Función base para peticiones HTTP con mejor manejo de errores
export const fetchWithAuth = async (
  endpoint: string, 
  options: RequestInit = {}
): Promise<any> => {
  try {
    console.log(`Fetching ${API_BASE_URL}${endpoint}`);
    
    const token = getAuthToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos de timeout

    const fetchOptions = {
      ...options,
      headers,
      signal: options.signal || controller.signal
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, fetchOptions);
    clearTimeout(timeoutId);

    // Verificar si la respuesta es un archivo
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/octet-stream')) {
      return response.blob();
    }

    // En caso de error 401 (no autorizado)
    if (response.status === 401) {
      console.error('Error de autenticación: No autorizado');
      toast.error('Sesión expirada. Por favor, inicie sesión nuevamente.');
      throw new Error('No autorizado. Sesión expirada.');
    }

    // En caso de error 404 (no encontrado)
    if (response.status === 404) {
      console.error(`Error 404: Recurso no encontrado - ${endpoint}`);
      throw new Error(`Recurso no encontrado: ${endpoint}`);
    }

    // Intentar parsear como JSON
    let data;
    const text = await response.text();
    
    try {
      data = text ? JSON.parse(text) : {};
    } catch (e) {
      console.error('Error al parsear respuesta como JSON:', e);
      console.error('Texto de respuesta:', text);
      throw new Error('Error al procesar la respuesta del servidor');
    }

    // Si hay un error del lado del servidor
    if (!response.ok) {
      console.error('Error de API:', data);
      throw new Error(data.error || `Error ${response.status}: ${response.statusText}`);
    }

    return data;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.error('Solicitud cancelada por timeout');
      throw new Error('La solicitud ha tardado demasiado tiempo');
    }
    
    console.error('Error en fetchWithAuth:', error);
    throw error;
  }
};
