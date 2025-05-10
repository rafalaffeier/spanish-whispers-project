
// Servicios para empleados
import { Employee } from '@/types/timesheet';
import { fetchWithAuth } from './apiHelpers';

// Obtener todos los empleados
export const getEmployees = async (): Promise<Employee[]> => {
  const data = await fetchWithAuth('/empleados');
  // Mapear respuesta de API a formato de la aplicación
  return data.map((emp: any) => ({
    id: emp.id,
    userId: emp.user_id,
    name: emp.nombre,
    email: emp.email,
    avatar: emp.avatar,
    role: emp.rol_nombre || 'empleado',
    isCompany: emp.es_empresa || false, // Añadido isCompany
    firstName: emp.nombre.split(' ')[0],
    lastName: emp.apellidos,
    dni: emp.dni,
    department: emp.departamento_nombre,
    position: emp.cargo,
    division: emp.division,
    country: emp.pais,
    city: emp.ciudad,
    address: emp.direccion,
    zipCode: emp.codigo_postal,
    phone: emp.telefono
  }));
};

// Obtener un empleado por ID
export const getEmployee = async (id: string): Promise<Employee> => {
  const data = await fetchWithAuth(`/empleados?id=${id}`);
  return {
    id: data.id,
    userId: data.user_id,
    name: data.nombre,
    email: data.email,
    avatar: data.avatar,
    role: data.rol_nombre || 'empleado',
    isCompany: data.es_empresa || false, // Añadido isCompany
    firstName: data.nombre.split(' ')[0],
    lastName: data.apellidos,
    dni: data.dni,
    department: data.departamento_nombre,
    position: data.cargo,
    division: data.division,
    country: data.pais,
    city: data.ciudad,
    address: data.direccion,
    zipCode: data.codigo_postal,
    phone: data.telefono
  };
};

// Actualizar datos de un empleado
export const updateEmployee = async (id: string, data: Partial<Employee>): Promise<void> => {
  // Mapear del formato de la aplicación al formato de la API
  const apiData = {
    nombre: data.name || data.firstName,
    apellidos: data.lastName,
    email: data.email,
    dni: data.dni,
    cargo: data.position,
    division: data.division,
    pais: data.country,
    ciudad: data.city,
    direccion: data.address,
    codigo_postal: data.zipCode,
    telefono: data.phone,
    avatar: data.avatar
  };

  await fetchWithAuth(`/empleados?id=${id}`, {
    method: 'PUT',
    body: JSON.stringify(apiData),
  });
};
