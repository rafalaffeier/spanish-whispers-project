
// Definición de tipos para la aplicación de control de jornada

// Tipo para representar un empleado
export interface Employee {
  id: string;
  userId: string;
  name: string;
  role: string;
  isCompany: boolean;
  
  // Campos adicionales para la interfaz de usuario
  email?: string;
  avatar?: string;
  firstName?: string;
  lastName?: string;
  dni?: string;
  department?: string;
  position?: string;
  division?: string;
  country?: string;
  province?: string;
  city?: string;
  address?: string;
  companyAddress?: string;
  zipCode?: string;
  phone?: string;
}

// Tipo para representar una jornada laboral
export interface Timesheet {
  id: string;
  employeeId: string;
  startTime: string;
  pauseTime?: string;
  resumeTime?: string;
  endTime?: string;
  status: string;
  totalTime?: number;
}

// Tipo para las opciones de estado de una jornada
export type TimesheetStatus = 'not_started' | 'active' | 'paused' | 'finished';

// Datos para inicio de sesión
export interface LoginData {
  email: string;
  password: string;
}

// Datos para recuperación de contraseña
export interface PasswordResetRequest {
  email: string;
}

// Datos para confirmar la recuperación de contraseña
export interface PasswordResetConfirm {
  token: string;
  email: string;
  password: string;
  confirmPassword?: string;
}

// Datos para registro de usuarios
export interface RegistrationData {
  type: 'employee' | 'company';
  email: string;
  password: string;
  confirmPassword?: string;
  
  // Campos para empleado
  firstName?: string;
  lastName?: string;
  dni?: string;
  
  // Campos para empresa
  companyName?: string;
  companyNif?: string;
  
  // Campos comunes
  phone: string;
  country: string;
  province?: string;
  companyAddress?: string;
  address?: string; // Dirección del empleado
  zipCode?: string;
}

// Otras interfaces necesarias para la aplicación
export interface TimesheetEntry {
  id: string;
  employeeId: string;
  employeeName?: string;
  date: string;
  startTime: Date | string | null;
  endTime: Date | string | null;
  signature?: string | null;
  status: TimesheetStatus;
  
  // Arrays para pausas y reinicios
  pauseTime: Date[] | string[];
  resumeTime: Date[] | string[];
  pauses?: PauseRecord[];
  
  // Campos adicionales para la interfaz
  recordType?: string;
  incidencia?: string;
  totalTime?: number;
}

// Tipo para registros de pausa
export interface PauseRecord {
  startTime: Date | string;
  endTime: Date | string | null;
  reason: string;
}

// Tipo para los períodos de visualización de timesheet
export type TimesheetPeriod = 'daily' | 'weekly' | 'monthly';

// Tipo para ubicación geográfica
export interface LocationData {
  startLocation: GeolocationPosition | null;
  endLocation: GeolocationPosition | null;
}
