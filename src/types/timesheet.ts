
export interface Employee {
  id: string;
  userId?: string; // ID del usuario en la tabla users
  name: string;
  email?: string;
  avatar?: string;
  role: 'empleado' | 'empleador';
  isCompany?: boolean;
  // Campos para el perfil
  firstName?: string;
  lastName?: string;
  dni?: string;
  department?: string;
  position?: string;
  division?: string;
  country?: string;
  city?: string;
  address?: string;
  zipCode?: string;
  phone?: string;
}

export interface PauseRecord {
  startTime: Date;
  endTime: Date | null;
  reason: string;
}

export interface TimesheetEntry {
  id: string;
  employeeId: string;
  employeeName?: string;
  date: string;
  startTime: Date | null;
  pauseTime: Date[];
  resumeTime: Date[];
  endTime: Date | null;
  signature: string | null;
  pauses: PauseRecord[];  // New field to track pause reasons
  location: {
    startLocation: GeolocationPosition | null;
    endLocation: GeolocationPosition | null;
  };
  status: TimesheetStatus;
  // Nuevos campos para cálculos semanales y mensuales
  weekNumber?: number;
  month?: number;
  year?: number;
  // Campos para el nuevo diseño
  recordType?: 'Entrada' | 'Pausa' | 'Salida';
  incidencia?: string;
  // Campo para horas totales para vistas mensuales/anuales
  totalHours?: number;
  totalHoursFormatted?: string;
}

// Enum for timesheet status
export type TimesheetStatus = 'not_started' | 'active' | 'paused' | 'finished';

// Periodo para filtrar timesheets
export type TimesheetPeriod = 'daily' | 'weekly' | 'monthly';

// Añadimos la interface para la empresa
export interface Company {
  id: number;
  userId?: string; // ID del usuario en la tabla users
  name: string;
  cifNif: string;
  address: string;
  province: string;
  zipCode: string;
  country: string;
  phone: string;
  email: string;
}

// Interface para el formulario de registro
export interface RegistrationData {
  type: 'employee' | 'company';
  firstName?: string;
  lastName?: string;
  dni?: string;
  companyName?: string;
  companyNif?: string;
  province?: string;
  companyAddress?: string;
  zipCode?: string;
  country?: string;
  phone?: string;
  email: string;
  password: string;
  confirmPassword: string;
}

// Interface para la recuperación de contraseña
export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  password: string;
  confirmPassword: string;
}
