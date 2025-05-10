
// Servicios para autenticación y registro
import { RegistrationData, PasswordResetRequest, PasswordResetConfirm, Employee } from '@/types/timesheet';
import { fetchWithAuth } from './apiHelpers';
import { setAuthToken } from './apiConfig';
import { toast } from "sonner";

// Función para iniciar sesión
export const login = async (email: string, password: string): Promise<{
  employee: Employee,
  token: string
}> => {
  const response = await fetchWithAuth('/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  if (response && response.token) {
    setAuthToken(response.token);
    
    // Mapear respuesta a formato Employee
    const employee: Employee = {
      id: response.empleado.id,
      userId: response.empleado.userId, // Añadido userId
      name: response.empleado.nombre,
      role: response.empleado.rol,
      isCompany: response.empleado.esEmpresa || false
    };

    // Guardar el empleado en localStorage para recuperarlo al recargar
    localStorage.setItem('currentEmployee', JSON.stringify(employee));

    return {
      employee,
      token: response.token
    };
  }

  throw new Error('Credenciales inválidas');
};

// Función para registrar usuarios (empleados o empresas)
export const register = async (data: RegistrationData): Promise<void> => {
  console.log("Enviando datos de registro:", JSON.stringify(data, null, 2));
  
  // Preparar datos para la API según si es empresa o empleado
  const apiData: Record<string, any> = {
    email: data.email,
    password: data.password
  };

  if (data.type === 'company') {
    // Datos específicos para una empresa (empleador)
    apiData.nombre = data.companyName;
    apiData.apellidos = ""; // Campo requerido pero vacío para empresas
    apiData.nif = data.companyNif;
    apiData.provincia = data.province;
    apiData.direccion = data.companyAddress;
    apiData.codigo_postal = data.zipCode;
    apiData.pais = data.country;
    apiData.telefono = data.phone;
    apiData.es_empresa = true;
    apiData.type = 'company'; // Aseguramos que se envía el tipo correcto
    apiData.rol = 'empleador'; // Usamos el nuevo rol simplificado
    
    console.log("Datos de registro de EMPRESA:", JSON.stringify(apiData, null, 2));
  } else {
    // Datos específicos para un empleado
    apiData.nombre = data.firstName;
    apiData.apellidos = data.lastName;
    apiData.dni = data.dni;
    apiData.companyNif = data.companyNif;
    apiData.provincia = data.province;
    apiData.direccion = data.companyAddress; 
    apiData.codigo_postal = data.zipCode;
    apiData.pais = data.country;
    apiData.telefono = data.phone;
    apiData.es_empresa = false;
    apiData.type = 'employee'; // Aseguramos que se envía el tipo correcto
    apiData.rol = 'empleado'; // Usamos el nuevo rol simplificado
    
    console.log("Datos de registro de EMPLEADO:", JSON.stringify(apiData, null, 2));
  }

  try {
    // Mostrar toast para indicar que se está procesando
    toast.info("Procesando registro...");
    
    console.log("Enviando solicitud a /registro con datos:", JSON.stringify(apiData, null, 2));
    
    // Enviar solicitud con un timeout de 15 segundos para evitar esperas indefinidas
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    
    const response = await fetchWithAuth('/registro', {
      method: 'POST',
      body: JSON.stringify(apiData),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    console.log("Respuesta del registro:", response);
    
    if (response && response.message) {
      toast.success(response.message);
    } else {
      toast.success("Registro completado exitosamente");
    }
    
    return response;
  } catch (error) {
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Error desconocido durante el registro';
    
    console.error("Error durante el registro:", error);
    toast.error(`Error en el registro: ${errorMessage}`);
    throw error;
  }
};

// Funciones para recuperación de contraseña
export const requestPasswordReset = async (data: PasswordResetRequest): Promise<void> => {
  await fetchWithAuth('/recuperar-password', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const confirmPasswordReset = async (data: PasswordResetConfirm): Promise<void> => {
  await fetchWithAuth('/reset-password', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};
