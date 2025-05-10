
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
    const fullUrl = `${API_BASE_URL}${endpoint}`;
    console.log(`Fetching ${fullUrl}`);
    console.log(`Request method: ${options.method || 'GET'}`);
    
    if (options.body) {
      console.log(`Request body: ${options.body}`);
    }
    
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

    // Log completo de la solicitud
    console.log("Enviando solicitud completa:", {
      url: fullUrl,
      options: JSON.stringify(fetchOptions, null, 2)
    });

    const response = await fetch(fullUrl, fetchOptions);
    clearTimeout(timeoutId);

    // Log del status de respuesta
    console.log(`Response status: ${response.status} ${response.statusText}`);

    // Verificar si la respuesta es un archivo
    const contentType = response.headers.get('content-type');
    console.log(`Content-Type de respuesta: ${contentType}`);
    
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
    
    // Log del texto de respuesta
    console.log("Response text:", text);
    
    // Verificar si el texto parece HTML (podría indicar un error de enrutamiento)
    if (text.trim().startsWith('<!DOCTYPE html>') || text.trim().startsWith('<html')) {
      console.error('La respuesta parece ser HTML en lugar de JSON:', text.substring(0, 200) + '...');
      throw new Error('El servidor respondió con HTML en lugar de JSON. Posible problema de configuración de API.');
    }
    
    try {
      data = text ? JSON.parse(text) : {};
      console.log("Response data parsed:", data);
    } catch (e) {
      console.error('Error al parsear respuesta como JSON:', e);
      console.error('Texto de respuesta:', text);
      throw new Error(`Error al procesar la respuesta del servidor: ${text.substring(0, 100)}...`);
    }

    // Si hay un error del lado del servidor
    if (!response.ok) {
      console.error('Error de API:', data);
      toast.error(data.error || `Error ${response.status}: ${response.statusText}`);
      throw new Error(data.error || `Error ${response.status}: ${response.statusText}`);
    }

    return data;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.error('Solicitud cancelada por timeout');
      toast.error('La solicitud ha tardado demasiado tiempo. Inténtelo de nuevo.');
      throw new Error('La solicitud ha tardado demasiado tiempo');
    }
    
    console.error('Error en fetchWithAuth:', error);
    toast.error(`Error: ${error.message || 'Error desconocido'}`);
    throw error;
  }
};
