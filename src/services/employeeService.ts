// Servicios para empleados
import { Employee } from '@/types/timesheet';
import { fetchWithAuth } from './apiHelpers';
import { toast } from '@/hooks/use-toast';

// Obtener todos los empleados
export const getEmployees = async (): Promise<Employee[]> => {
  const data = await fetchWithAuth('/empleados');
  return data.map((emp: any) => ({
    id: emp.id,
    userId: emp.user_id,
    name: emp.nombre,
    email: emp.email,
    avatar: emp.avatar,
    role: emp.rol_nombre || 'empleado',
    isCompany: emp.es_empresa || false,
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
    phone: emp.telefono,
    nifdeMiEmpresa: emp.nifdeMiEmpresa
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
    isCompany: data.es_empresa || false,
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
    phone: data.telefono,
    nifdeMiEmpresa: data.nifdeMiEmpresa
  };
};

// Actualizar datos de un empleado
export const updateEmployee = async (id: string, data: Partial<Employee>): Promise<void> => {
  try {
    console.log("Enviando datos de actualización al servidor:", data);
    
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

    const response = await fetchWithAuth(`/empleados?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(apiData),
    });
    
    console.log("Respuesta del servidor:", response);
    
    // Almacenar también en localStorage para mantener los datos actualizados
    const currentEmployeeStr = localStorage.getItem('currentEmployee');
    if (currentEmployeeStr) {
      try {
        const currentEmployee = JSON.parse(currentEmployeeStr);
        const updatedEmployee = { ...currentEmployee, ...data };
        localStorage.setItem('currentEmployee', JSON.stringify(updatedEmployee));
      } catch (e) {
        console.error("Error actualizando datos en localStorage:", e);
      }
    }
    
    return response;
  } catch (error) {
    console.error("Error actualizando empleado:", error);
    throw error;
  }
};

// Cargar empleado con información geográfica
export const getEmployeeWithLocation = async (id: string): Promise<Employee> => {
  try {
    const employee = await getEmployee(id);
    
    // Si el empleado tiene dirección, intentamos obtener coordenadas
    if (employee.address && employee.city) {
      console.log("Obteniendo coordenadas para:", employee.address, employee.city);
      // En una implementación real, aquí se conectaría con la API de Google Maps
      // Para esta versión, simplemente simulamos datos de coordenadas
      
      // Nota: No podemos asignar directamente employee.location porque no existe en el tipo Employee
      // Usamos una variable temporal para los datos de ubicación que podrían usarse en otro contexto
      const locationData = {
        lat: 41.6175899, // Coordenadas de ejemplo para Lleida
        lng: 0.6200146
      };
      
      // Si se necesitara usar esta información, habría que añadir una propiedad location al tipo Employee
      console.log("Coordenadas simuladas:", locationData);
    }
    
    return employee;
  } catch (error) {
    console.error("Error cargando información de ubicación:", error);
    throw error;
  }
};
