
// Funciones auxiliares para la API
import { toast } from "sonner";
import { API_BASE_URL, getAuthToken } from './apiConfig';
import { isValidDate, toSafeDate } from '@/utils/dateUtils';

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

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers
    });

    // Verificar si la respuesta es un archivo
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/octet-stream')) {
      return response.blob();
    }

    // Para otros tipos, intentar parsear como JSON
    let data;
    try {
      data = await response.json();
    } catch (e) {
      console.error('Error al parsear respuesta JSON:', e);
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
