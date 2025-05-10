
// Servicios para jornadas laborales
import { TimesheetEntry, PauseRecord } from '@/types/timesheet';
import { fetchWithAuth } from './apiHelpers';
import { mapStatusFromApi, formatDateForApi } from './apiHelpers';

// Obtener todas las jornadas
export const getTimesheets = async (): Promise<TimesheetEntry[]> => {
  const data = await fetchWithAuth('/jornadas');
  // Mapear respuesta de API a formato de la aplicación
  return data.map(mapApiTimesheetToApp);
};

// Obtener jornadas de un empleado
export const getTimesheetsByEmployee = async (employeeId: string): Promise<TimesheetEntry[]> => {
  const data = await fetchWithAuth(`/jornadas?empleado_id=${employeeId}`);
  return data.map(mapApiTimesheetToApp);
};

// Obtener la jornada de hoy para un empleado
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

// Iniciar una nueva jornada
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

// Pausar una jornada
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

// Reanudar una jornada pausada
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

// Finalizar una jornada
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

// Obtener una jornada por ID
export const getTimesheet = async (id: string): Promise<TimesheetEntry> => {
  const data = await fetchWithAuth(`/jornadas?id=${id}`);
  return mapApiTimesheetToApp(data);
};

// Actualizar una jornada
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

// Mapear jornada desde formato API a formato aplicación
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

// Función auxiliar para mapear estados al formato de la API
const mapStatusToApi = (status: string): string => {
  const statusMap: Record<string, string> = {
    'not_started': 'no_iniciada',
    'active': 'activa',
    'paused': 'pausada',
    'finished': 'finalizada'
  };
  return statusMap[status] || status;
};
