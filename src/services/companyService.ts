
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
    
    try {
      console.log(`[COMPANY SERVICE] Consultando API en: ${API_BASE_URL}/empresas?nif=${encodeURIComponent(normalizedNif)}`);
      
      // Usar fetch directo en lugar de fetchWithAuth para evitar problemas de autenticación
      const response = await fetch(`${API_BASE_URL}/empresas?nif=${encodeURIComponent(normalizedNif)}`);
      
      if (!response.ok) {
        console.error(`[COMPANY SERVICE] Error en consulta: ${response.status} ${response.statusText}`);
        throw new Error(`Error en consulta: ${response.status}`);
      }
      
      const text = await response.text();
      console.log('[COMPANY SERVICE] Respuesta recibida:', text);
      
      try {
        const data = JSON.parse(text);
        
        if (data && Array.isArray(data) && data.length > 0) {
          console.log('[COMPANY SERVICE] Empresa encontrada:', data[0]);
          return {
            exists: true,
            company: {
              id: data[0].id,
              name: data[0].nombre
            }
          };
        } else {
          console.log('[COMPANY SERVICE] No se encontró ninguna empresa');
          return { exists: false };
        }
      } catch (jsonError) {
        console.error('[COMPANY SERVICE] Error al parsear respuesta JSON:', jsonError);
        return { exists: false };
      }
    } catch (error) {
      console.error('[COMPANY SERVICE] Error en consulta:', error);
      return { exists: false };
    }
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
