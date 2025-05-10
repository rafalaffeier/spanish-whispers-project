
// Servicios para gestión de empresas
import { fetchWithAuth, normalizeNif } from './apiHelpers';
import { toast } from "sonner";
import { API_BASE_URL } from './apiConfig';

// Mock data para empresas conocidas (para desarrolladores)
const MOCK_COMPANIES = [
  { nif: 'Y8619064N', name: 'Fluss Creative' },
  { nif: 'B12345678', name: 'APLIUM APLICACIONES TELEMATICAS SL' },
  { nif: 'A87654321', name: 'Empresa Ejemplo S.A.' }
];

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
    
    // Verificar en datos mock primero (para desarrollo)
    const mockCompany = MOCK_COMPANIES.find(c => normalizeNif(c.nif) === normalizedNif);
    if (mockCompany) {
      console.log('[COMPANY SERVICE] Empresa encontrada en datos mock:', mockCompany);
      return {
        exists: true,
        company: {
          id: normalizedNif, // ID temporal
          name: mockCompany.name
        }
      };
    }
    
    // Verificar usando la API
    try {
      const response = await fetch(`${API_BASE_URL}/empresas/verify?nif=${encodeURIComponent(normalizedNif)}`);
      const data = await response.json();
      
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
    } catch (apiError) {
      console.error('[COMPANY SERVICE] Error al verificar con API:', apiError);
      // Continuar con la lógica para no bloquear el flujo
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
