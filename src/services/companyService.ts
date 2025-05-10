
// Servicios para gestión de empresas
import { fetchWithAuth, normalizeNif } from './apiHelpers';
import { toast } from "sonner";
import { API_BASE_URL } from './apiConfig';

// Verificar si una empresa existe por su NIF/CIF
export const verifyCompanyByNif = async (nif: string): Promise<{exists: boolean, company?: {id: string, name: string}}> => {
  try {
    if (!nif || nif.length < 8) {
      console.log('[COMPANY SERVICE] NIF inválido o demasiado corto');
      return { exists: false };
    }
    
    // Normalizar el NIF para la búsqueda
    const normalizedNif = normalizeNif(nif);
    console.log(`[COMPANY SERVICE] Verificando empresa con NIF normalizado: ${normalizedNif}`);
    
    // Verificar usando la API
    try {
      const response = await fetch(`${API_BASE_URL}/empresas/verify?nif=${encodeURIComponent(normalizedNif)}`);
      
      // Log de la respuesta completa para depuración
      const responseText = await response.text();
      try {
        const data = JSON.parse(responseText);
        
        if (data && data.exists) {
          console.log('[COMPANY SERVICE] Empresa encontrada en la API:', data.company);
          return {
            exists: true,
            company: {
              id: data.company.id,
              name: data.company.nombre
            }
          };
        }
      } catch (jsonError) {
        console.error('[COMPANY SERVICE] Error al parsear respuesta JSON:', jsonError);
        console.log('[COMPANY SERVICE] Respuesta recibida:', responseText);
      }
    } catch (apiError) {
      console.error('[COMPANY SERVICE] Error al verificar con API:', apiError);
    }
    
    // Fallback al no encontrar la empresa, intentar con la API de búsqueda directa
    try {
      console.log(`[COMPANY SERVICE] Intentando búsqueda directa de empresa con NIF: ${normalizedNif}`);
      const response = await fetch(`${API_BASE_URL}/empresas?nif=${encodeURIComponent(normalizedNif)}`);
      const data = await response.json();
      
      if (data && Array.isArray(data) && data.length > 0) {
        console.log('[COMPANY SERVICE] Empresa encontrada en búsqueda directa:', data[0]);
        return {
          exists: true,
          company: {
            id: data[0].id,
            name: data[0].nombre
          }
        };
      }
    } catch (directSearchError) {
      console.error('[COMPANY SERVICE] Error en búsqueda directa:', directSearchError);
    }
    
    // Si llegamos aquí, la empresa no existe
    console.log('[COMPANY SERVICE] No se encontró ninguna empresa con ese NIF');
    return { exists: false };
  } catch (error) {
    console.error('[COMPANY SERVICE] Error al verificar empresa:', error);
    return { exists: false };
  }
};

// Obtener lista de empresas
export const getCompanies = async () => {
  try {
    return await fetchWithAuth('/empresas');
  } catch (error) {
    console.error('Error al obtener empresas:', error);
    toast.error('Error al cargar la lista de empresas');
    throw error;
  }
};
