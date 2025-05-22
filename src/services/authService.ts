import { RegistrationData, PasswordResetRequest, PasswordResetConfirm, Employee } from '@/types/timesheet';
import { fetchWithAuth } from './apiHelpers';
import { setAuthToken, API_BASE_URL } from './apiConfig';
import { toast } from "sonner";

/**
 * Centraliza la detección correcta del rol del usuario según múltiples posibles fuentes.
 * Retorna tanto el rol, si es empleador, motivo, y los datos brutos para debug.
 */
function resolveEmployeeRole(user: any) {
  // Recolectamos todos los candidatos a campos de rol/empresa
  const rol       = typeof user.rol === 'string'    ? user.rol.toLowerCase()    : '';
  const role      = typeof user.role === 'string'   ? user.role.toLowerCase()   : '';
  const rol_id    = user.rol_id !== undefined      ? user.rol_id               : null;
  const esEmpresa = user.esEmpresa === true         || user.es_empresa === true;
  const isCompany = user.is_company === true        || user.isCompany === true;
  const email     = typeof user.email === 'string'  ? user.email                : '';

  // Prioridad de evaluación:
  if (rol_id == 1 || rol_id === '1') {
    return {
      role:        'empleador',
      isCompany:   true,
      reason:      "rol_id == 1 → empleador (PRIORIDAD MÁXIMA)",
      raw:         { rol, role, rol_id, esEmpresa, isCompany, email }
    };
  }
  if (['empleador', 'admin', 'administrador'].includes(rol) || 
      ['empleador', 'admin', 'administrador'].includes(role)) {
    return {
      role:        'empleador',
      isCompany:   true,
      reason:      "rol/role texto → empleador/admin",
      raw:         { rol, role, rol_id, esEmpresa, isCompany, email }
    };
  }
  if (esEmpresa || isCompany) {
    return {
      role:        'empleador',
      isCompany:   true,
      reason:      "Flag esEmpresa/is_company true",
      raw:         { rol, role, rol_id, esEmpresa, isCompany, email }
    };
  }
  // Workaround: patron de admin por email
  if (
    typeof email === 'string' &&
    (email.includes('admin@') ||
     email.includes('empleador@') ||
     email.endsWith('@tudominio.com'))
  ) {
    return {
      role:        'empleador',
      isCompany:   true,
      reason:      'Workaround por email (contiene admin@, empleador@ o tu dominio)',
      raw:         { rol, role, rol_id, esEmpresa, isCompany, email }
    };
  }
  // Fallback: empleado
  return {
    role:        'empleado',
    isCompany:   false,
    reason:      "Ningún criterio de empleador, asignado como empleado",
    raw:         { rol, role, rol_id, esEmpresa, isCompany, email }
  };
}


// ---- FUNCIÓN LOGIN ----
export const login = async (email: string, password: string): Promise<{
  employee: Employee,
  token: string
}> => {
  try {
    console.log("[authService] Login attempt for:", email);
    console.log("[authService] API Base URL:", API_BASE_URL);

    const response = await fetchWithAuth('/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    console.log("[authService] Login API response:", response);

    const user = response.user;

    // Aplicar lógica mejorada: detección única del rol
    const {
      role,
      isCompany,
      reason,
      raw
    } = resolveEmployeeRole(user);

    // Almacenar para el front
    const employee: Employee = {
      id:         user.id        || '',
      userId:     user.id        || '',
      name:       (user.nombre && String(user.nombre).trim() !== "" && user.nombre !== null)
                     ? user.nombre
                     : (user.email || 'Usuario'),
      email:      user.email     || '',
      avatar:     user.avatar    || '',
      role:       role,
      isCompany:  isCompany,
      firstName:  user.nombre?.split(' ')[0] || '',
      lastName:   user.apellidos || '',
      dni:        user.dni || user.nif || '',
      department: user.departamento_nombre || '',
      position:   user.cargo || '',
      division:   user.division || '',
      country:    user.pais || '',
      city:       user.ciudad || '',
      address:    user.direccion || '',
      zipCode:    user.codigo_postal || '',
      phone:      user.telefono || '',
      nifdeMiEmpresa: user.nifdeMiEmpresa || '',
    };

    // Info de debug transparente para el DebugPanel y logs
    (employee as any)._debug_redirectionInfo = {
      role_fields: raw,
      DETECCION_MOTIVO: reason
    };
    console.log("[authService] Detección de rol:", reason, raw);

    // Guardar empleado en localStorage (para otros componentes/contextos)
    localStorage.setItem('currentEmployee', JSON.stringify(employee));
    // Guardar token explícitamente también para la API
    localStorage.setItem('authToken', response.token);

    return {
      employee,
      token: response.token
    };
  } catch (error: any) {
    console.error('[authService] Error durante el login:', error);
    if (error.response) {
      console.error('[authService] Error response:', error.response);
    }
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


// ---- REGISTRO Y RECUPERACIÓN DE CONTRASEÑA (sin tocar) ----
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
