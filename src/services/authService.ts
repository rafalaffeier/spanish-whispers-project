
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
    type: data.type,
    email: data.email,
    password: data.password
  };

  if (data.type === 'company') {
    // Datos específicos para una empresa
    apiData.companyName = data.companyName;
    apiData.companyNif = data.companyNif;
    apiData.province = data.province;
    apiData.companyAddress = data.companyAddress;
    apiData.zipCode = data.zipCode;
    apiData.country = data.country;
    apiData.phone = data.phone;
  } else {
    // Datos específicos para un empleado
    apiData.firstName = data.firstName;
    apiData.lastName = data.lastName;
    apiData.dni = data.dni;
    apiData.companyNif = data.companyNif;
    apiData.province = data.province;
    apiData.companyAddress = data.companyAddress; // Aunque se llama companyAddress, estamos guardando la dirección del empleado
    apiData.zipCode = data.zipCode;
    apiData.country = data.country;
    apiData.phone = data.phone;
  }

  try {
    await fetchWithAuth('/registro', {
      method: 'POST',
      body: JSON.stringify(apiData),
    });
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
