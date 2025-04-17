
export interface Employee {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  role: 'employee' | 'admin' | 'Técnico' | 'Administrativo' | 'Supervisor';
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
}

// Enum for timesheet status
export type TimesheetStatus = 'not_started' | 'active' | 'paused' | 'finished';

// Añadimos la interface para la empresa
export interface Company {
  id: number;
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
