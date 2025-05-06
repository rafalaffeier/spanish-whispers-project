// Servicio de API para conectar con el backend MySQL
import { toast } from "@/hooks/use-toast";
import { Employee, TimesheetEntry, PauseRecord } from '@/types/timesheet';

// URL base de la API (actualizada para el subdirectorio)
const API_BASE_URL = 'http://aplium.com/apphora/api';

// Token de autenticación
let authToken: string | null = null;

// Función para inicializar el token desde localStorage
export const initializeAuth = () => {
  const storedToken = localStorage.getItem('authToken');
  if (storedToken) {
    authToken = storedToken;
  }
};

// Ejecutar al cargar
initializeAuth();

// Función para configurar el token de autenticación
export const setAuthToken = (token: string) => {
  authToken = token;
  localStorage.setItem('authToken', token);
};

// Función para limpiar la autenticación
export const clearAuth = () => {
  authToken = null;
  localStorage.removeItem('authToken');
  localStorage.removeItem('currentEmployee');
};

// Función base para peticiones HTTP
const fetchWithAuth = async (
  url: string,
  options: RequestInit = {}
): Promise<any> => {
  try {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Añadir token de autenticación si existe
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers,
    });

    // Verificar si la respuesta es exitosa
    if (!response.ok) {
      // Si es 401 Unauthorized, limpiar autenticación
      if (response.status === 401) {
        clearAuth();
      }

      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
    }

    // Para respuestas vacías (como en DELETE)
    if (response.status === 204) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("API error:", error);
    const message = error instanceof Error ? error.message : String(error);
    toast({
      title: "Error de API",
      description: message,
      variant: "destructive",
    });
    throw error;
  }
};

// Funciones para empleados
export const getEmployees = async (): Promise<Employee[]> => {
  const data = await fetchWithAuth('/empleados');
  // Mapear respuesta de API a formato de la aplicación
  return data.map((emp: any) => ({
    id: emp.id,
    name: emp.nombre,
    email: emp.email,
    avatar: emp.avatar,
    role: emp.rol_nombre || 'empleado',
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

export const getEmployee = async (id: string): Promise<Employee> => {
  const data = await fetchWithAuth(`/empleados?id=${id}`);
  return {
    id: data.id,
    name: data.nombre,
    email: data.email,
    avatar: data.avatar,
    role: data.rol_nombre || 'empleado',
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

// Funciones para jornadas
export const getTimesheets = async (): Promise<TimesheetEntry[]> => {
  const data = await fetchWithAuth('/jornadas');
  // Mapear respuesta de API a formato de la aplicación
  return data.map(mapApiTimesheetToApp);
};

export const getTimesheetsByEmployee = async (employeeId: string): Promise<TimesheetEntry[]> => {
  const data = await fetchWithAuth(`/jornadas?empleado_id=${employeeId}`);
  return data.map(mapApiTimesheetToApp);
};

export const getTodayTimesheet = async (employeeId: string): Promise<TimesheetEntry | null> => {
  const today = new Date().toISOString().split('T')[0];
  try {
    const data = await fetchWithAuth(`/jornadas?empleado_id=${employeeId}&fecha=${today}`);
    if (data && data.length > 0) {
      return mapApiTimesheetToApp(data[0]);
    }
    return null;
  } catch (error) {
    console.error("Error getting today timesheet:", error);
    return null;
  }
};

export const startTimesheet = async (
  employeeId: string, 
  location: GeolocationPosition | null
): Promise<TimesheetEntry> => {
  const locationData = location ? {
    latitud: location.coords.latitude,
    longitud: location.coords.longitude,
    precision: location.coords.accuracy
  } : undefined;

  const data = await fetchWithAuth('/jornadas?action=iniciar', {
    method: 'POST',
    body: JSON.stringify({
      empleado_id: employeeId,
      ubicacion: locationData,
      dispositivo: navigator.userAgent
    }),
  });

  // Obtener la jornada completa después de iniciarla
  return await getTimesheet(data.id);
};

export const pauseTimesheet = async (
  timesheetId: string,
  reason: string,
  location: GeolocationPosition | null
): Promise<void> => {
  const locationData = location ? {
    latitud: location.coords.latitude,
    longitud: location.coords.longitude,
    precision: location.coords.accuracy
  } : undefined;

  await fetchWithAuth('/jornadas?action=pausar', {
    method: 'POST',
    body: JSON.stringify({
      jornada_id: timesheetId,
      motivo: reason,
      ubicacion: locationData
    }),
  });
};

export const resumeTimesheet = async (
  timesheetId: string,
  location: GeolocationPosition | null
): Promise<void> => {
  const locationData = location ? {
    latitud: location.coords.latitude,
    longitud: location.coords.longitude,
    precision: location.coords.accuracy
  } : undefined;

  await fetchWithAuth('/jornadas?action=reanudar', {
    method: 'POST',
    body: JSON.stringify({
      jornada_id: timesheetId,
      ubicacion: locationData
    }),
  });
};

export const endTimesheet = async (
  timesheetId: string,
  signature: string | null,
  location: GeolocationPosition | null
): Promise<void> => {
  const locationData = location ? {
    latitud: location.coords.latitude,
    longitud: location.coords.longitude,
    precision: location.coords.accuracy
  } : undefined;

  await fetchWithAuth('/jornadas?action=finalizar', {
    method: 'POST',
    body: JSON.stringify({
      jornada_id: timesheetId,
      firma: signature,
      ubicacion: locationData,
      dispositivo: navigator.userAgent
    }),
  });
};

export const getTimesheet = async (id: string): Promise<TimesheetEntry> => {
  const data = await fetchWithAuth(`/jornadas?id=${id}`);
  return mapApiTimesheetToApp(data);
};

export const updateTimesheet = async (id: string, data: Partial<TimesheetEntry>): Promise<void> => {
  // Mapear del formato de la aplicación al formato de la API
  const apiData: Record<string, any> = {};
  
  if (data.startTime) apiData.hora_inicio = formatDateForApi(data.startTime);
  if (data.endTime) apiData.hora_fin = formatDateForApi(data.endTime);
  if (data.signature) apiData.firma = data.signature;
  if (data.status) apiData.estado = mapStatusToApi(data.status);

  await fetchWithAuth(`/jornadas?id=${id}`, {
    method: 'PUT',
    body: JSON.stringify(apiData),
  });
};

// Funciones de autenticación
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
    };

    return {
      employee,
      token: response.token
    };
  }

  throw new Error('Credenciales inválidas');
};

// Funciones de ayuda
const mapStatusToApi = (status: string): string => {
  const statusMap: Record<string, string> = {
    'not_started': 'no_iniciada',
    'active': 'activa',
    'paused': 'pausada',
    'finished': 'finalizada'
  };
  return statusMap[status] || status;
};

const mapStatusFromApi = (status: string): string => {
  const statusMap: Record<string, string> = {
    'no_iniciada': 'not_started',
    'activa': 'active',
    'pausada': 'paused',
    'finalizada': 'finished'
  };
  return statusMap[status] || status;
};

const formatDateForApi = (date: Date): string => {
  return date instanceof Date
    ? date.toISOString()
    : new Date(date).toISOString();
};

const mapApiTimesheetToApp = (data: any): TimesheetEntry => {
  // Mapear pausas
  const pauses: PauseRecord[] = data.pausas ? data.pausas.map((pausa: any) => ({
    startTime: new Date(pausa.hora_inicio),
    endTime: pausa.hora_fin ? new Date(pausa.hora_fin) : null,
    reason: pausa.motivo
  })) : [];

  // Mapear ubicaciones
  let startLocation = null;
  let endLocation = null;
  
  if (data.ubicaciones) {
    const inicioUbicacion = data.ubicaciones.find((u: any) => u.tipo === 'inicio');
    const finUbicacion = data.ubicaciones.find((u: any) => u.tipo === 'fin');
    
    if (inicioUbicacion) {
      startLocation = {
        coords: {
          latitude: parseFloat(inicioUbicacion.latitud),
          longitude: parseFloat(inicioUbicacion.longitud),
          accuracy: parseFloat(inicioUbicacion.precision_gps) || 0,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null
        },
        timestamp: new Date(inicioUbicacion.timestamp).getTime()
      } as GeolocationPosition;
    }
    
    if (finUbicacion) {
      endLocation = {
        coords: {
          latitude: parseFloat(finUbicacion.latitud),
          longitude: parseFloat(finUbicacion.longitud),
          accuracy: parseFloat(finUbicacion.precision_gps) || 0,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null
        },
        timestamp: new Date(finUbicacion.timestamp).getTime()
      } as GeolocationPosition;
    }
  }

  return {
    id: data.id,
    employeeId: data.empleado_id,
    employeeName: data.empleado_nombre,
    date: data.fecha,
    startTime: data.hora_inicio ? new Date(data.hora_inicio) : null,
    endTime: data.hora_fin ? new Date(data.hora_fin) : null,
    signature: data.firma,
    status: mapStatusFromApi(data.estado) as 'not_started' | 'active' | 'paused' | 'finished',
    pauseTime: pauses.map(p => p.startTime),
    resumeTime: pauses.filter(p => p.endTime).map(p => p.endTime as Date),
    pauses,
    location: {
      startLocation,
      endLocation
    }
  };
};
