
// Servicios para autenticación y registro
import { RegistrationData, PasswordResetRequest, PasswordResetConfirm, Employee } from '@/types/timesheet';
import { fetchWithAuth } from './apiHelpers';
import { setAuthToken } from './apiConfig';

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
  console.log("Enviando datos de registro:", data);
  
  // Preparar datos para la API según si es empresa o empleado
  const apiData: Record<string, any> = {
    email: data.email,
    password: data.password
  };

  if (data.type === 'company') {
    // Datos específicos para una empresa
    apiData.nombre = data.companyName;
    apiData.apellidos = ""; // Campo requerido pero vacío para empresas
    apiData.nif = data.companyNif;
    apiData.provincia = data.province;
    apiData.direccion = data.companyAddress;
    apiData.codigo_postal = data.zipCode;
    apiData.pais = data.country;
    apiData.telefono = data.phone;
    apiData.es_empresa = true;
    apiData.rol_id = 5; // ID del rol 'empresa'
    apiData.type = 'company'; // Aseguramos que se envía el tipo correcto
  } else {
    // Datos específicos para un empleado
    apiData.nombre = data.firstName;
    apiData.apellidos = data.lastName;
    apiData.dni = data.dni;
    apiData.empresa_nif = data.companyNif;
    apiData.provincia = data.province;
    apiData.direccion = data.companyAddress; 
    apiData.codigo_postal = data.zipCode;
    apiData.pais = data.country;
    apiData.telefono = data.phone;
    apiData.es_empresa = false;
    apiData.rol_id = 2; // ID del rol 'empleado'
    apiData.type = 'employee'; // Aseguramos que se envía el tipo correcto
  }

  console.log("Datos formateados para API:", apiData);

  try {
    // Importante: NO añadir token para registro
    const response = await fetchWithAuth('/registro', {
      method: 'POST',
      body: JSON.stringify(apiData),
    });
    
    console.log("Respuesta del registro:", response);
    return response;
  } catch (error) {
    console.error("Error durante el registro:", error);
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
