// Definición de tipos para la aplicación de control de jornada

// Tipo para representar un empleado
export interface Employee {
  id: string;
  userId: string; // Añadido userId
  name: string;
  role: string;
  isCompany: boolean;
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
